

import { app } from "spectrum-ts";

  // https
  export const APP_URL = "https://www.nmap.org"; // replace url

  // keyword to get app
  export const APP_KEYWORD = "app";

  export function isAppRequest(text: string): boolean {
    return text.trim().toLowerCase() === APP_KEYWORD;
  }

  // why r u sending 2x 
  // mental exhaustion 8x
  export function appCard(url: string = APP_URL) {
    return app(url);
  }
