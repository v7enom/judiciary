import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";

// Middleware للتحقق من الصلاحيات
const requireRole = (allowedRoles: string[]) => {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({ 
        code: 'FORBIDDEN',
        message: 'ليس لديك الصلاحية للوصول إلى هذه الوظيفة'
      });
    }
    return next({ ctx });
  });
};

// Helper لتسجيل العمليات في Audit Log
async function logAudit(
  action: string,
  entityType: string,
  entityId: number,
  userId: number,
  userName: string,
  userRole: string,
  details?: any,
  ipAddress?: string
) {
  await db.createAuditLog({
    action,
    entityType,
    entityId,
    details: details ? JSON.stringify(details) : null,
    userId,
    userName,
    userRole: userRole as any,
    ipAddress: ipAddress || null,
  });
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ User Management ============
  users: router({
    getAll: requireRole(['admin']).query(async () => {
      return await db.getAllUsers();
    }),

    updateRole: requireRole(['admin']).input(z.object({
      userId: z.number(),
      role: z.enum(['admin', 'judge', 'investigator', 'officer', 'member']),
    })).mutation(async ({ input, ctx }) => {
      await db.updateUserRole(input.userId, input.role);
      await logAudit(
        'UPDATE_USER_ROLE',
        'user',
        input.userId,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        ctx.user.role,
        { newRole: input.role }
      );
      return { success: true };
    }),
  }),

  // ============ Player Management ============
  players: router({
    getByRobloxId: protectedProcedure.input(z.object({
      robloxUserId: z.number(),
    })).query(async ({ input }) => {
      return await db.getPlayerByRobloxId(input.robloxUserId);
    }),

    getById: protectedProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ input }) => {
      return await db.getPlayerById(input.id);
    }),

    upsert: requireRole(['admin', 'officer', 'investigator']).input(z.object({
      robloxUserId: z.number(),
      robloxUsername: z.string(),
    })).mutation(async ({ input }) => {
      await db.upsertPlayer(input);
      return { success: true };
    }),

    getTopOffenders: protectedProcedure.input(z.object({
      limit: z.number().default(10),
    })).query(async ({ input }) => {
      return await db.getTopOffenders(input.limit);
    }),
  }),

  // ============ Case Management ============
  cases: router({
    create: requireRole(['admin', 'officer']).input(z.object({
      crimeType: z.string(),
      description: z.string(),
      accusedPlayerId: z.number(),
      accusedPlayerName: z.string(),
      complainantName: z.string(),
      complainantDiscordId: z.string().optional(),
      witnesses: z.string().optional(),
      severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    })).mutation(async ({ input, ctx }) => {
      // توليد رقم القضية الفريد
      const year = new Date().getFullYear();
      const allCases = await db.getAllCases();
      const caseNumber = `RC-${year}-${String(allCases.length + 1).padStart(5, '0')}`;

      const caseId = await db.createCase({
        caseNumber,
        crimeType: input.crimeType,
        description: input.description,
        accusedPlayerId: input.accusedPlayerId,
        accusedPlayerName: input.accusedPlayerName,
        complainantName: input.complainantName,
        complainantDiscordId: input.complainantDiscordId || null,
        witnesses: input.witnesses || null,
        severity: input.severity,
        status: 'open',
        verdict: 'pending',
        createdById: ctx.user.id,
        closedById: null,
        closedAt: null,
        punishment: null,
      });

      // تحديث إحصائيات اللاعب
      const player = await db.getPlayerById(input.accusedPlayerId);
      if (player) {
        await db.updatePlayerStats(input.accusedPlayerId, {
          totalCases: player.totalCases + 1,
        });
      }

      await logAudit(
        'CREATE_CASE',
        'case',
        caseId!,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        ctx.user.role,
        { caseNumber, crimeType: input.crimeType }
      );

      return { success: true, caseId, caseNumber };
    }),

    getAll: protectedProcedure.query(async () => {
      return await db.getAllCases();
    }),

    getById: protectedProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ input }) => {
      return await db.getCaseById(input.id);
    }),

    getByCaseNumber: protectedProcedure.input(z.object({
      caseNumber: z.string(),
    })).query(async ({ input }) => {
      return await db.getCaseByCaseNumber(input.caseNumber);
    }),

    getByStatus: protectedProcedure.input(z.object({
      status: z.enum(['open', 'investigating', 'pending_judgment', 'closed']),
    })).query(async ({ input }) => {
      return await db.getCasesByStatus(input.status);
    }),

    getByPlayerId: protectedProcedure.input(z.object({
      playerId: z.number(),
    })).query(async ({ input }) => {
      return await db.getCasesByPlayerId(input.playerId);
    }),

    updateStatus: requireRole(['admin', 'judge', 'investigator']).input(z.object({
      id: z.number(),
      status: z.enum(['open', 'investigating', 'pending_judgment', 'closed']),
    })).mutation(async ({ input, ctx }) => {
      await db.updateCase(input.id, { status: input.status });
      await logAudit(
        'UPDATE_CASE_STATUS',
        'case',
        input.id,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        ctx.user.role,
        { newStatus: input.status }
      );
      return { success: true };
    }),

    finalizeCase: requireRole(['admin', 'judge']).input(z.object({
      id: z.number(),
      verdict: z.enum(['guilty', 'not_guilty']),
      punishment: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const caseData = await db.getCaseById(input.id);
      if (!caseData) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'القضية غير موجودة' });
      }

      await db.updateCase(input.id, {
        status: 'closed',
        verdict: input.verdict,
        punishment: input.punishment || null,
        closedById: ctx.user.id,
        closedAt: new Date(),
      });

      // تحديث إحصائيات اللاعب
      const player = await db.getPlayerById(caseData.accusedPlayerId);
      if (player) {
        const updates: any = {};
        if (input.verdict === 'guilty') {
          updates.convictions = player.convictions + 1;
        } else {
          updates.acquittals = player.acquittals + 1;
        }
        await db.updatePlayerStats(caseData.accusedPlayerId, updates);
      }

      await logAudit(
        'FINALIZE_CASE',
        'case',
        input.id,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        ctx.user.role,
        { verdict: input.verdict, punishment: input.punishment }
      );

      return { success: true };
    }),

    search: protectedProcedure.input(z.object({
      query: z.string(),
    })).query(async ({ input }) => {
      return await db.searchCases(input.query);
    }),
  }),

  // ============ Evidence Management ============
  evidence: router({
    add: requireRole(['admin', 'investigator', 'officer']).input(z.object({
      caseId: z.number(),
      type: z.enum(['image', 'video', 'document', 'link', 'audio']),
      url: z.string(),
      fileKey: z.string().optional(),
      description: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const evidenceId = await db.addEvidence({
        caseId: input.caseId,
        type: input.type,
        url: input.url,
        fileKey: input.fileKey || null,
        description: input.description || null,
        uploadedById: ctx.user.id,
        uploadedByName: ctx.user.name || 'Unknown',
      });

      await logAudit(
        'ADD_EVIDENCE',
        'evidence',
        evidenceId!,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        ctx.user.role,
        { caseId: input.caseId, type: input.type }
      );

      return { success: true, evidenceId };
    }),

    getByCaseId: protectedProcedure.input(z.object({
      caseId: z.number(),
    })).query(async ({ input }) => {
      return await db.getEvidenceByCaseId(input.caseId);
    }),

    delete: requireRole(['admin', 'investigator']).input(z.object({
      id: z.number(),
    })).mutation(async ({ input, ctx }) => {
      await db.deleteEvidence(input.id);
      await logAudit(
        'DELETE_EVIDENCE',
        'evidence',
        input.id,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        ctx.user.role
      );
      return { success: true };
    }),
  }),

  // ============ Notes Management ============
  notes: router({
    add: requireRole(['admin', 'judge', 'investigator', 'officer']).input(z.object({
      caseId: z.number(),
      content: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const noteId = await db.addNote({
        caseId: input.caseId,
        content: input.content,
        authorId: ctx.user.id,
        authorName: ctx.user.name || 'Unknown',
        authorRole: ctx.user.role as any,
      });

      await logAudit(
        'ADD_NOTE',
        'note',
        noteId!,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        ctx.user.role,
        { caseId: input.caseId }
      );

      return { success: true, noteId };
    }),

    getByCaseId: protectedProcedure.input(z.object({
      caseId: z.number(),
    })).query(async ({ input }) => {
      return await db.getNotesByCaseId(input.caseId);
    }),

    update: requireRole(['admin', 'judge', 'investigator', 'officer']).input(z.object({
      id: z.number(),
      content: z.string(),
    })).mutation(async ({ input, ctx }) => {
      await db.updateNote(input.id, input.content);
      await logAudit(
        'UPDATE_NOTE',
        'note',
        input.id,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        ctx.user.role
      );
      return { success: true };
    }),

    delete: requireRole(['admin']).input(z.object({
      id: z.number(),
    })).mutation(async ({ input, ctx }) => {
      await db.deleteNote(input.id);
      await logAudit(
        'DELETE_NOTE',
        'note',
        input.id,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        ctx.user.role
      );
      return { success: true };
    }),
  }),

  // ============ Audit Logs ============
  auditLogs: router({
    getAll: requireRole(['admin', 'judge']).input(z.object({
      limit: z.number().default(100),
    })).query(async ({ input }) => {
      return await db.getAuditLogs(input.limit);
    }),

    getByEntity: requireRole(['admin', 'judge']).input(z.object({
      entityType: z.string(),
      entityId: z.number(),
    })).query(async ({ input }) => {
      return await db.getAuditLogsByEntity(input.entityType, input.entityId);
    }),
  }),

  // ============ Case Requests ============
  caseRequests: router({
    // إنشاء طلب قضية (للأعضاء)
    create: requireRole(['member', 'officer', 'admin']).input(z.object({
      suspectRobloxId: z.number(),
      suspectRobloxUsername: z.string(),
      complainantRobloxId: z.number().optional(),
      complainantRobloxUsername: z.string().optional(),
      crimeType: z.string(),
      description: z.string(),
      location: z.string().optional(),
      incidentDate: z.date().optional(),
      evidenceUrls: z.array(z.string()).optional(),
    })).mutation(async ({ input, ctx }) => {
      const requestId = await db.createCaseRequest({
        ...input,
        evidenceUrls: input.evidenceUrls ? JSON.stringify(input.evidenceUrls) : null,
        requesterId: ctx.user.id,
        requesterName: ctx.user.name || 'Unknown',
      });
      
      await logAudit(
        'CREATE_CASE_REQUEST',
        'case_request',
        requestId!,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        ctx.user.role
      );
      
      return { success: true, requestId };
    }),

    // عرض جميع الطلبات (للمسؤولين)
    getAll: requireRole(['admin', 'officer']).query(async () => {
      return await db.getAllCaseRequests();
    }),

    // عرض الطلبات قيد الانتظار
    getPending: requireRole(['admin', 'officer']).query(async () => {
      return await db.getPendingCaseRequests();
    }),

    // عرض طلبات المستخدم الحالي
    getMy: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCaseRequestsByUser(ctx.user.id);
    }),

    // عرض طلب محدد
    getById: protectedProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ input }) => {
      return await db.getCaseRequestById(input.id);
    }),

    // الموافقة على طلب وإنشاء قضية
    approve: requireRole(['admin', 'officer']).input(z.object({
      requestId: z.number(),
      reviewNotes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      // الحصول على بيانات الطلب
      const request = await db.getCaseRequestById(input.requestId);
      if (!request) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'الطلب غير موجود' });
      }
      
      if (request.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'الطلب تمت مراجعته بالفعل' });
      }

      // توليد رقم القضية الفريد
      const year = new Date().getFullYear();
      const allCases = await db.getAllCases();
      const caseNumber = `RC-${year}-${String(allCases.length + 1).padStart(5, '0')}`;

      // إنشاء قضية جديدة
      const caseId = await db.createCase({
        caseNumber,
        crimeType: request.crimeType,
        description: request.description,
        accusedPlayerId: request.suspectRobloxId,
        accusedPlayerName: request.suspectRobloxUsername,
        complainantName: request.complainantRobloxUsername || 'غير محدد',
        createdById: ctx.user.id,
      });

      // تحديث حالة الطلب
      await db.approveCaseRequest(
        input.requestId,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        input.reviewNotes || null,
        caseId!
      );

      // إضافة الأدلة إن وجدت
      if (request.evidenceUrls) {
        try {
          const urls = JSON.parse(request.evidenceUrls);
          for (const url of urls) {
            await db.addEvidence({
              caseId: caseId!,
              type: 'link',
              url,
              uploadedById: ctx.user.id,
              uploadedByName: ctx.user.name || 'Unknown',
            });
          }
        } catch (e) {
          // ignore JSON parse errors
        }
      }

      await logAudit(
        'APPROVE_CASE_REQUEST',
        'case_request',
        input.requestId,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        ctx.user.role,
        { caseId, reviewNotes: input.reviewNotes }
      );

      return { success: true, caseId };
    }),

    // رفض طلب
    reject: requireRole(['admin', 'officer']).input(z.object({
      requestId: z.number(),
      reviewNotes: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const request = await db.getCaseRequestById(input.requestId);
      if (!request) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'الطلب غير موجود' });
      }
      
      if (request.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'الطلب تمت مراجعته بالفعل' });
      }

      await db.rejectCaseRequest(
        input.requestId,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        input.reviewNotes
      );

      await logAudit(
        'REJECT_CASE_REQUEST',
        'case_request',
        input.requestId,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        ctx.user.role,
        { reviewNotes: input.reviewNotes }
      );

      return { success: true };
    }),
  }),

  // ============ Statistics ============
  statistics: router({
    getCaseStats: protectedProcedure.query(async () => {
      return await db.getCaseStatistics();
    }),
  }),
});

export type AppRouter = typeof appRouter;
