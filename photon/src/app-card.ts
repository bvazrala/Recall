import { app } from "spectrum-ts";

// Texting this gets the quiz card.
export const APP_KEYWORD = "app";

const QUIZ_PATH = "/quizzes/take";

// A quick tunnel (`cloudflared tunnel --url ...`) serves its public hostname on a local metrics
// port: the first free one from 20241 to 20245, unless CLOUDFLARED_METRICS names one.
const METRICS_PORTS = process.env.CLOUDFLARED_METRICS
  ? [Number(process.env.CLOUDFLARED_METRICS)]
  : [20241, 20242, 20243, 20244, 20245];

async function tunnelHostname(): Promise<string | undefined> {
  for (const port of METRICS_PORTS) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/quicktunnel`, { signal: AbortSignal.timeout(500) });
      if (!res.ok) continue;
      const { hostname } = (await res.json()) as { hostname?: string };
      if (hostname) return hostname;
    } catch {
      // nothing listening on this port; try the next
    }
  }
  return undefined;
}

// The quiz page in the web app. QUIZ_URL in the root .env wins if set; otherwise the link is built
// from the running Cloudflare tunnel, so a restarted tunnel (with a new address) needs no edits.
export async function quizUrl(): Promise<string | undefined> {
  const fixed = process.env.QUIZ_URL?.trim();
  if (fixed) return fixed;
  const host = await tunnelHostname();
  return host ? `https://${host}${QUIZ_PATH}` : undefined;
}

export const NO_QUIZ_URL_TEXT = "The quiz link isn't available right now. Is the Cloudflare tunnel running?";

export function isAppRequest(text: string): boolean {
  return text.trim().toLowerCase() === APP_KEYWORD;
}

// TODO: replies are sometimes delivered twice; still being investigated.
export function appCard(url: string) {
  return app(url);
}
