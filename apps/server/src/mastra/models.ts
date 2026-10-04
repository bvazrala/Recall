// The Claude models Recall uses. Override either one in .env to try another model without changing code.
export const models = {
  // Reading notes and writing questions.
  strong: process.env.MODEL_STRONG ?? "anthropic/claude-sonnet-5-5",
  // Grading replies and parsing commands: the cheapest and fastest model.
  fast: process.env.MODEL_FAST ?? "anthropic/claude-haiku-4-5-20251001",
};

// Sonnet 5.5 thinks before it answers, and thinking is billed as output tokens.
// "low" keeps thinking short for routine work. Raise it to "medium" for question writing if quality drops.
// Use this only with the strong model: Haiku 4.5 doesn't support the effort setting.
export const strongOptions = {
  providerOptions: { anthropic: { effort: "low" } },
} as const;
