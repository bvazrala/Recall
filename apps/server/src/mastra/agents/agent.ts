import { Agent } from '@mastra/core/agent';

export const myAgent = new Agent({
  id: 'my-agent',
  name: 'My Agent',
  instructions: 'You are a helpful assistant.',
  // Change provider/model here (e.g., switch from OpenAI to Anthropic or Google)
  model: 'anthropic/claude-sonnet-4-6', 
})