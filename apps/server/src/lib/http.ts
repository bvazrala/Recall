import type { ContextWithMastra } from "@mastra/core/server";
import { z, ZodError } from "zod";

export type Ctx = ContextWithMastra;

export class HttpError extends Error {
  constructor(
    public status: 400 | 404 | 409 | 502,
    message: string,
  ) {
    super(message);
  }
}

// Wraps a handler so thrown HttpErrors and bad input become JSON error responses.
export function guard(fn: (c: Ctx) => Promise<Response>) {
  return async (c: Ctx): Promise<Response> => {
    try {
      return await fn(c);
    } catch (e) {
      if (e instanceof HttpError) return c.json({ error: e.message }, e.status);
      if (e instanceof ZodError) return c.json({ error: "Invalid request", issues: z.treeifyError(e) }, 400);
      throw e;
    }
  };
}

export async function parseBody<S extends z.ZodType>(c: Ctx, schema: S): Promise<z.infer<S>> {
  let raw: unknown = {};
  const text = await c.req.text();
  if (text) {
    try {
      raw = JSON.parse(text);
    } catch {
      throw new HttpError(400, "Body must be valid JSON");
    }
  }
  return schema.parse(raw);
}

// Path params are uuids; reject anything else before it reaches Postgres.
export function idParam(c: Ctx, name: string): string {
  const parsed = z.uuid().safeParse(c.req.param(name));
  if (!parsed.success) throw new HttpError(400, `${name} must be a uuid`);
  return parsed.data;
}

export function idQuery(c: Ctx, name: string): string {
  const parsed = z.uuid().safeParse(c.req.query(name));
  if (!parsed.success) throw new HttpError(400, `${name} query param must be a uuid`);
  return parsed.data;
}

export function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "23505" || err?.cause?.code === "23505";
}
