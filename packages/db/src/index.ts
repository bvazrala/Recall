export * from "./client";
export * from "./schema";

// Query helpers, re-exported so apps don't need their own drizzle-orm copy.
export { and, asc, count, desc, eq, getTableColumns, inArray, isNotNull, sql } from "drizzle-orm";

// Temporary: apps/server/src/check.ts uses this. Delete both in the server layer.
export const dbStatus = "db is wired up";
