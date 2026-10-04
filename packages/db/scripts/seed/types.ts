// One topic with its flashcards. Each card is [label, prompt, answer].
export type Deck = {
  name: string;
  description: string;
  cards: [label: string, prompt: string, answer: string][];
};
