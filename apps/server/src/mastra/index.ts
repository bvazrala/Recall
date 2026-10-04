import { Mastra } from "@mastra/core";
import { example } from "./routes/example";
import { status } from "./routes/status";
import { getConfidenceGrid } from "./routes/confidence";
import { dayRoutes } from "./routes/day";
import { flashcardRoutes } from "./routes/flashcards";
import { getHistory } from "./routes/history";
import { topicRoutes } from "./routes/topics";
import { myAgent } from "./agents/agent";

// `mastra dev` and `mastra build` look for this export. Register routes in server.apiRoutes.
export const mastra = new Mastra({
  agents: { myAgent },
  server: {
    port: Number(process.env.PORT ?? 4111),
    // The Next.js dashboard calls this API from the browser.
    cors: { origin: [process.env.WEB_ORIGIN ?? "http://localhost:3000"], credentials: true },
    apiRoutes: [status, example, ...topicRoutes, ...flashcardRoutes, ...dayRoutes, getHistory, getConfidenceGrid],
  },
});
