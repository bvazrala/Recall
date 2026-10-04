// Texts a student through Photon, which owns the iMessage connection (photon/src/outbox.ts).
// Best effort: a failure is logged, never thrown, so it can't break the request that triggered it.
const PHOTON_URL = process.env.PHOTON_URL ?? "http://127.0.0.1:4112";

export async function sendText(phone: string, text: string): Promise<void> {
  try {
    const res = await fetch(`${PHOTON_URL}/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to: phone, text }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) console.error(`Photon couldn't send to ${phone}: ${res.status} ${await res.text()}`);
  } catch (e) {
    console.error(`Photon is unreachable at ${PHOTON_URL}; text to ${phone} not sent`, e);
  }
}
