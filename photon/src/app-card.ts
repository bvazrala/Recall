import { app } from "spectrum-ts";

// The page the card opens. Swap this for your own site when ready.
export const APP_URL = "https://www.google.com";

// Text the bot this word to get the card.
export const APP_KEYWORD = "app";

export function isAppRequest(text: string): boolean {
  return text.trim().toLowerCase() === APP_KEYWORD;
}

// Live card: renders in Photon's Spectrum iMessage app if the recipient has it
// installed; otherwise falls back to a normal link.
export function appCard(url: string = APP_URL) {
  return app(url, { live: true });
}