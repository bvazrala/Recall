import { existsSync, readFileSync } from "node:fs";
import { extname } from "node:path";
import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { prepareImage } from "../src/lib/images";
import { models, strongOptions } from "../src/mastra/models";

if (existsSync(".env")) process.loadEnvFile(".env");
if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is missing. Add it to apps/server/.env.");

// USD per million tokens (input, output), from Anthropic's pricing page.
const PRICES: Record<string, [number, number]> = { "claude-sonnet-5-5": [2, 10], "claude-haiku-4-5": [1, 5] };
let totalUsd = 0;
function cost(model: string, usage: { inputTokens?: number; outputTokens?: number }) {
  const price = Object.entries(PRICES).find(([id]) => model.includes(id))?.[1];
  const input = usage.inputTokens ?? 0;
  const output = usage.outputTokens ?? 0;
  const usd = price ? (input * price[0] + output * price[1]) / 1_000_000 : 0;
  totalUsd += usd;
  return `${input} in / ${output} out${price ? `, about $${usd.toFixed(4)}` : ""}`;
}

const fast = new Agent({ id: "check-fast", name: "Check (fast)", instructions: "Follow the requested format exactly.", model: models.fast });
const strong = new Agent({
  id: "check-strong",
  name: "Check (strong)",
  instructions: "You help a study app. Follow the requested format exactly.",
  model: models.strong,
  defaultOptions: strongOptions,
});

// 1. Plain text on the fast model: the key works.
const hello = await fast.generate("Reply with exactly: Claude is working");
console.log(`1. Text (${models.fast}):`, hello.text.trim(), `[${cost(models.fast, hello.usage)}]`);

// 2. Structured output on the strong model: JSON that a Zod schema accepts. Every Recall AI call works this way.
const Question = z.object({
  prompt: z.string(),
  choices: z.array(z.string()).length(4),
  answer: z.enum(["A", "B", "C", "D"]),
});
const generated = await strong.generate("Write one multiple-choice question about inserting into a binary heap.", {
  structuredOutput: { schema: Question },
});
const question = Question.parse(generated.object);
console.log(`2. JSON (${models.strong}):`, question.prompt, "| answer:", question.answer, `[${cost(models.strong, generated.usage)}]`);

// 3. Reading notes: a photo (converted and shrunk first) or a PDF.
const IMAGE_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
};
const path = process.argv[2];
if (!path) {
  console.log("3. Notes: skipped. Run again with a photo or PDF to test reading notes.");
} else {
  const ext = extname(path).toLowerCase();
  const imageType = IMAGE_TYPES[ext];
  if (ext !== ".pdf" && !imageType) throw new Error(`Unsupported file type: ${ext}. Use jpg, png, webp, gif, heic, or pdf.`);
  const bytes = readFileSync(path);
  const file = imageType ? await prepareImage(bytes, imageType) : { data: bytes, mediaType: "application/pdf" };
  const read = await strong.generate([
    {
      role: "user",
      content: [
        { type: "text", text: "Transcribe these study notes exactly as written. Return only the text." },
        { type: "file", data: file.data, mediaType: file.mediaType },
      ],
    },
  ]);
  console.log(`3. Notes (sent ${Math.round(file.data.length / 1024)} KB):`, read.text.trim().slice(0, 400), `[${cost(models.strong, read.usage)}]`);
}

console.log(`Total for this check: about $${totalUsd.toFixed(4)}`);
