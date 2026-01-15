import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, index } from "drizzle-orm/mysql-core";

/**
 * جدول المستخدمين مع نظام الصلاحيات الخمسة
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  // نظام الصلاحيات: admin, judge, investigator, officer, member
  role: mysqlEnum("role", ["admin", "judge", "investigator", "officer", "member"]).default("member").notNull(),
  discordId: varchar("discordId", { length: 64 }),
  discordUsername: varchar("discordUsername", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  discordIdIdx: index("discord_id_idx").on(table.discordId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * جدول اللاعبين في Roblox
 */
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  robloxUserId: bigint("robloxUserId", { mode: "number" }).notNull().unique(),
  robloxUsername: varchar("robloxUsername", { length: 255 }).notNull(),
  totalCases: int("totalCases").default(0).notNull(),
  convictions: int("convictions").default(0).notNull(),
  acquittals: int("acquittals").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  robloxUserIdIdx: index("roblox_user_id_idx").on(table.robloxUserId),
  robloxUsernameIdx: index("roblox_username_idx").on(table.robloxUsername),
}));

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * جدول القضايا
 */
export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  // رقم القضية الفريد بصيغة RC-YYYY-XXXXX
  caseNumber: varchar("caseNumber", { length: 20 }).notNull().unique(),
  // حالة القضية
  status: mysqlEnum("status", ["open", "investigating", "pending_judgment", "closed"]).default("open").notNull(),
  // مستوى الخطورة
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  // نوع الجريمة
  crimeType: varchar("crimeType", { length: 255 }).notNull(),
  // وصف القضية
  description: text("description").notNull(),
  // المتهم
  accusedPlayerId: int("accusedPlayerId").notNull(),
  accusedPlayerName: varchar("accusedPlayerName", { length: 255 }).notNull(),
  // المشتكي
  complainantName: varchar("complainantName", { length: 255 }).notNull(),
  complainantDiscordId: varchar("complainantDiscordId", { length: 64 }),
  // الشهود
  witnesses: text("witnesses"), // JSON array
  // الحكم
  verdict: mysqlEnum("verdict", ["pending", "guilty", "not_guilty"]).default("pending").notNull(),
  punishment: text("punishment"),
  // من قام بإنشاء القضية
  createdById: int("createdById").notNull(),
  // من قام بإغلاق القضية (القاضي)
  closedById: int("closedById"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  caseNumberIdx: index("case_number_idx").on(table.caseNumber),
  statusIdx: index("status_idx").on(table.status),
  accusedPlayerIdIdx: index("accused_player_id_idx").on(table.accusedPlayerId),
  crimeTypeIdx: index("crime_type_idx").on(table.crimeType),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

/**
 * جدول الأدلة
 */
export const evidence = mysqlTable("evidence", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  // نوع الدليل
  type: mysqlEnum("type", ["image", "video", "document", "link", "audio"]).notNull(),
  // رابط الدليل
  url: text("url").notNull(),
  fileKey: text("fileKey"),
  // وصف الدليل
  description: text("description"),
  // من قام برفع الدليل
  uploadedById: int("uploadedById").notNull(),
  uploadedByName: varchar("uploadedByName", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  caseIdIdx: index("case_id_idx").on(table.caseId),
}));

export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = typeof evidence.$inferInsert;

/**
 * جدول الملاحظات والتعليقات
 */
export const notes = mysqlTable("notes", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  content: text("content").notNull(),
  // من قام بإضافة الملاحظة
  authorId: int("authorId").notNull(),
  authorName: varchar("authorName", { length: 255 }).notNull(),
  authorRole: mysqlEnum("authorRole", ["admin", "judge", "investigator", "officer", "viewer"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  caseIdIdx: index("case_id_idx").on(table.caseId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

/**
 * سجل التدقيق (Audit Log) - غير قابل للتلاعب
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  // نوع العملية
  action: varchar("action", { length: 100 }).notNull(),
  // الكيان المتأثر
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId").notNull(),
  // التفاصيل
  details: text("details"), // JSON
  // من قام بالعملية
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  userRole: mysqlEnum("userRole", ["admin", "judge", "investigator", "officer", "member"]).notNull(),
  // IP Address للأمان
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  entityTypeIdx: index("entity_type_idx").on(table.entityType),
  entityIdIdx: index("entity_id_idx").on(table.entityId),
  userIdIdx: index("user_id_idx").on(table.userId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * جدول إعدادات Discord
 */
export const discordSettings = mysqlTable("discord_settings", {
  id: int("id").autoincrement().primaryKey(),
  botToken: text("botToken"),
  guildId: varchar("guildId", { length: 64 }),
  notificationChannelId: varchar("notificationChannelId", { length: 64 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DiscordSettings = typeof discordSettings.$inferSelect;
export type InsertDiscordSettings = typeof discordSettings.$inferInsert;

/**
 * جدول طلبات القضايا (للأعضاء)
 */
export const caseRequests = mysqlTable("case_requests", {
  id: int("id").autoincrement().primaryKey(),
  // معلومات الطلب
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  // معلومات المتهم
  suspectRobloxId: bigint("suspectRobloxId", { mode: "number" }).notNull(),
  suspectRobloxUsername: varchar("suspectRobloxUsername", { length: 255 }).notNull(),
  // معلومات المشتكي
  complainantRobloxId: bigint("complainantRobloxId", { mode: "number" }),
  complainantRobloxUsername: varchar("complainantRobloxUsername", { length: 255 }),
  // تفاصيل القضية
  crimeType: varchar("crimeType", { length: 100 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }),
  incidentDate: timestamp("incidentDate"),
  // الأدلة
  evidenceUrls: text("evidenceUrls"), // JSON array
  // معلومات مقدم الطلب
  requesterId: int("requesterId").notNull(),
  requesterName: varchar("requesterName", { length: 255 }).notNull(),
  // معلومات المراجع
  reviewerId: int("reviewerId"),
  reviewerName: varchar("reviewerName", { length: 255 }),
  reviewNotes: text("reviewNotes"),
  reviewedAt: timestamp("reviewedAt"),
  // رقم القضية بعد الموافقة
  approvedCaseId: int("approvedCaseId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  requesterIdIdx: index("requester_id_idx").on(table.requesterId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type CaseRequest = typeof caseRequests.$inferSelect;
export type InsertCaseRequest = typeof caseRequests.$inferInsert;
