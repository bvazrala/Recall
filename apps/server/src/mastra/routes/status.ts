import { registerApiRoute } from "@mastra/core/server";

// Example custom route, and a cheap "is the Recall API up" check for the dashboard.
// Mastra already serves its own /health, so this one uses a different path.
export const status = registerApiRoute("/status", {
  method: "GET",
  requiresAuth: false,
  handler: (c) => c.json({ ok: true, service: "recall" }),
});
