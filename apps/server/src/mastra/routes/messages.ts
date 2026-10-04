import { registerApiRoute } from "@mastra/core/server";
import { chatMessageBody } from "@recall/core";
import { getDb } from "../../db";
import { reply } from "../../lib/chat";
import { resolveStudent } from "../../lib/day";
import { guard, parseBody } from "../../lib/http";

// A text from the student (via Photon). Returns Recall's reply, or null for a repeat delivery.
export const postMessage = registerApiRoute("/students/:studentId/messages", {
  method: "POST",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const { text, providerMessageId } = await parseBody(c, chatMessageBody);
    const student = await resolveStudent(db, c.req.param("studentId"));
    return c.json({ reply: await reply(db, student, text, providerMessageId) });
  }),
});

export const messageRoutes = [postMessage];
