import { registerApiRoute } from "@mastra/core/server";

// Example endpoint for the dashboard demo. Copy this file when adding a real route.
export const example = registerApiRoute("/example", {
  method: "GET",
  requiresAuth: false,
  handler: (c) => c.json({ message: "Example endpoint" }),
});
