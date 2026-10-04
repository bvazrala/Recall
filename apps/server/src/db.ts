import { createDb, type Db } from "@recall/db";

let db: Db | undefined;

// One shared pool for the whole server, created on first use.
export function getDb(): Db {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Copy apps/server/.env.example to .env.");
    db = createDb(url).db;
  }
  return db;
}
