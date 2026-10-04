import { NotRegisteredError } from "./morning.ts";

const API_URL = process.env.API_URL ?? "http://localhost:4111";

// Sends the student's text to Recall and returns the reply, or null if Recall already
// answered this message (a repeated delivery).
export async function askRecall(handle: string, text: string, messageId: string): Promise<string | null> {
  const res = await fetch(`${API_URL}/students/${handle.replace(/\D/g, "")}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, providerMessageId: messageId }),
  });
  if (res.status === 404) throw new NotRegisteredError(handle);
  if (!res.ok) throw new Error(`Recall chat failed: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { reply: string | null }).reply;
}
