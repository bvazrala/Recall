import { Mastra } from "@mastra/core";
import { example } from "./routes/example";
import { status } from "./routes/status";
import { nextDay, studentDay } from "./routes/student-day";

// `mastra dev` and `mastra build` look for this export. Register routes in server.apiRoutes.
export const mastra = new Mastra({
  server: {
    port: Number(process.env.PORT ?? 4111),
    // The Next.js dashboard calls this API from the browser.
    cors: { origin: [process.env.WEB_ORIGIN ?? "http://localhost:3000"], credentials: true },
    apiRoutes: [status, example, studentDay, nextDay],
  },
});
