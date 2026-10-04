import { Agent } from "@mastra/core/agent";
import { models, strongOptions } from "../models";

export const myAgent = new Agent({
  id: "my-agent",
  name: "My Agent",
  instructions: "You are a helpful assistant.",
  model: models.strong, // Claude Sonnet 5.5. Change models in ../models.ts or in .env.
  defaultOptions: strongOptions, // low effort keeps token use down
});
