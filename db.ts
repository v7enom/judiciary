import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, players, cases, evidence, notes, auditLogs, caseRequests, InsertPlayer, InsertCase, InsertEvidence, InsertNote, InsertAuditLog, InsertCaseRequest } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Management ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "discordId", "discordUsername"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "admin" | "judge" | "investigator" | "officer" | "member") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ============ Player Management ============

export async function upsertPlayer(player: InsertPlayer) {
  const db = await getDb();
  if (!db) return;

  await db.insert(players).values(player).onDuplicateKeyUpdate({
    set: {
      robloxUsername: player.robloxUsername,
      updatedAt: new Date(),
    },
  });
}

export async function getPlayerByRobloxId(robloxUserId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(players).where(eq(players.robloxUserId, robloxUserId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPlayerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePlayerStats(playerId: number, stats: { totalCases?: number; convictions?: number; acquittals?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(players).set(stats).where(eq(players.id, playerId));
}

export async function getTopOffenders(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(players).orderBy(desc(players.totalCases)).limit(limit);
}

// ============ Case Management ============

export async function createCase(caseData: InsertCase) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(cases).values(caseData);
  return result[0].insertId;
}

export async function getCaseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCaseByCaseNumber(caseNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cases).where(eq(cases.caseNumber, caseNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCases() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(cases).orderBy(desc(cases.createdAt));
}

export async function getCasesByStatus(status: "open" | "investigating" | "pending_judgment" | "closed") {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(cases).where(eq(cases.status, status)).orderBy(desc(cases.createdAt));
}

export async function getCasesByPlayerId(playerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(cases).where(eq(cases.accusedPlayerId, playerId)).orderBy(desc(cases.createdAt));
}

export async function updateCase(id: number, updates: Partial<InsertCase>) {
  const db = await getDb();
  if (!db) return;
  await db.update(cases).set(updates).where(eq(cases.id, id));
}

export async function searchCases(query: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(cases).where(
    or(
      like(cases.caseNumber, `%${query}%`),
      like(cases.accusedPlayerName, `%${query}%`),
      like(cases.complainantName, `%${query}%`),
      like(cases.crimeType, `%${query}%`)
    )
  ).orderBy(desc(cases.createdAt));
}

// ============ Evidence Management ============

export async function addEvidence(evidenceData: InsertEvidence) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(evidence).values(evidenceData);
  return result[0].insertId;
}

export async function getEvidenceByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(evidence).where(eq(evidence.caseId, caseId)).orderBy(desc(evidence.createdAt));
}

export async function deleteEvidence(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(evidence).where(eq(evidence.id, id));
}

// ============ Notes Management ============

export async function addNote(noteData: InsertNote) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(notes).values(noteData);
  return result[0].insertId;
}

export async function getNotesByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notes).where(eq(notes.caseId, caseId)).orderBy(desc(notes.createdAt));
}

export async function updateNote(id: number, content: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(notes).set({ content, updatedAt: new Date() }).where(eq(notes.id, id));
}

export async function deleteNote(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(notes).where(eq(notes.id, id));
}

// ============ Audit Log ============

export async function createAuditLog(logData: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(logData);
}

export async function getAuditLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function getAuditLogsByEntity(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(auditLogs).where(
    and(
      eq(auditLogs.entityType, entityType),
      eq(auditLogs.entityId, entityId)
    )
  ).orderBy(desc(auditLogs.createdAt));
}

// ============ Statistics ============

export async function getCaseStatistics() {
  const db = await getDb();
  if (!db) return { total: 0, open: 0, investigating: 0, pendingJudgment: 0, closed: 0 };

  const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(cases);
  const [openResult] = await db.select({ count: sql<number>`count(*)` }).from(cases).where(eq(cases.status, 'open'));
  const [investigatingResult] = await db.select({ count: sql<number>`count(*)` }).from(cases).where(eq(cases.status, 'investigating'));
  const [pendingResult] = await db.select({ count: sql<number>`count(*)` }).from(cases).where(eq(cases.status, 'pending_judgment'));
  const [closedResult] = await db.select({ count: sql<number>`count(*)` }).from(cases).where(eq(cases.status, 'closed'));

  return {
    total: Number(totalResult?.count || 0),
    open: Number(openResult?.count || 0),
    investigating: Number(investigatingResult?.count || 0),
    pendingJudgment: Number(pendingResult?.count || 0),
    closed: Number(closedResult?.count || 0),
  };
}


// ============ Case Requests Management ============

export async function createCaseRequest(request: InsertCaseRequest) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(caseRequests).values(request);
  return result[0].insertId;
}

export async function getAllCaseRequests() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(caseRequests).orderBy(desc(caseRequests.createdAt));
}

export async function getPendingCaseRequests() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(caseRequests)
    .where(eq(caseRequests.status, 'pending'))
    .orderBy(desc(caseRequests.createdAt));
}

export async function getCaseRequestById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(caseRequests).where(eq(caseRequests.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getCaseRequestsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(caseRequests)
    .where(eq(caseRequests.requesterId, userId))
    .orderBy(desc(caseRequests.createdAt));
}

export async function approveCaseRequest(
  requestId: number,
  reviewerId: number,
  reviewerName: string,
  reviewNotes: string | null,
  caseId: number
) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(caseRequests)
    .set({
      status: 'approved',
      reviewerId,
      reviewerName,
      reviewNotes,
      approvedCaseId: caseId,
      reviewedAt: new Date(),
    })
    .where(eq(caseRequests.id, requestId));
}

export async function rejectCaseRequest(
  requestId: number,
  reviewerId: number,
  reviewerName: string,
  reviewNotes: string
) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(caseRequests)
    .set({
      status: 'rejected',
      reviewerId,
      reviewerName,
      reviewNotes,
      reviewedAt: new Date(),
    })
    .where(eq(caseRequests.id, requestId));
}
