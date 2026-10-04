export * from "./client";
export * from "./schema";

// Query helpers, re-exported so apps don't need their own drizzle-orm copy.
export { and, asc, count, desc, eq, getTableColumns, gte, inArray, isNotNull, lte, max, sql } from "drizzle-orm";

// Temporary: apps/server/src/check.ts uses this. Delete both in the server layer.
export const dbStatus = "db is wired up";
