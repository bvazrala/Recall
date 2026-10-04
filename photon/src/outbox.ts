import { createServer } from "node:http";

// The part of a messaging platform the outbox needs: open a 1:1 chat with a phone and send text.
interface Texter {
  space: { create(user: string): Promise<{ send(text: string): Promise<unknown> }> };
}

const PORT = Number(process.env.PHOTON_PORT ?? 4112);

// Lets the Recall server text a student first (e.g. the post-quiz review): POST /send { to, text }.
// Bound to 127.0.0.1, so only processes on this machine can use it.
export function startOutbox(platform: Texter) {
  const server = createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/send") {
      res.writeHead(404).end();
      return;
    }
    try {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const { to, text } = JSON.parse(raw) as { to?: string; text?: string };
      const digits = to?.replace(/\D/g, "");
      if (!digits || !text) {
        res.writeHead(400).end("to and text are required");
        return;
      }
      const space = await platform.space.create(`+${digits}`);
      await space.send(text);
      res.writeHead(200).end("sent");
    } catch (err) {
      console.error("Outbox send failed", err);
      res.writeHead(500).end(String(err));
    }
  });
  server.listen(PORT, "127.0.0.1", () => console.log(`Outbox listening on 127.0.0.1:${PORT}`));
}
