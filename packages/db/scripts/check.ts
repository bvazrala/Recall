import { existsSync } from "node:fs";
import { eq } from "drizzle-orm";
import { createDb, students } from "../src";

if (existsSync(".env")) process.loadEnvFile(".env");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is missing. Copy .env.example to .env and paste your Neon URL.");

const { db, pool } = createDb(url);
const phone = "+15550000000";

await db.delete(students).where(eq(students.phone, phone));
const [created] = await db.insert(students).values({ phone }).returning();
const [found] = await db.select().from(students).where(eq(students.phone, phone));
console.log(found?.id === created?.id ? "Database OK" : "Mismatch!", "| default timezone:", found?.timezone);
await db.delete(students).where(eq(students.phone, phone));
await pool.end();
