// Placeholder content for screens the server has no endpoints for yet (classes, quizzes, uploads,
// study guides, settings, account). Each export names the backend work that would replace it.

export const USER = { name: "Maya Chen", first: "Maya", email: "maya.chen@example.edu", phone: "+1 (555) 010-0142", initials: "MC" };

// Needs: review log counts per day (reviews table exists, no route).
export const REVIEWS_PER_DAY = [18, 22, 9, 0, 25, 19, 14, 12, 21, 6, 0, 17, 24, 14];

// Needs: a classes entity (topics are flat today). Maya has one class, MCAT, holding all of her topics.
export const CLASSES = [{ code: "MCAT", name: "MCAT" }];

// Needs: syllabus upload + topic extraction.
export const PLAN_STEPS = ["Reading your file", "Finding topics", "Planning your weeks", "Writing flashcards and quizzes"];
export const EXTRACTED_TOPICS = [
  ["Cell membranes", 5], ["Membrane transport", 5], ["Enzyme kinetics", 6], ["Intro to metabolism", 6], ["Glycolysis", 6], ["Krebs cycle", 6],
  ["Oxidative phosphorylation", 7], ["Photosynthesis", 7], ["Cell signaling", 8], ["The cytoskeleton", 8], ["Cell cycle", 9], ["Mitosis and meiosis", 9],
] as const;

// Needs: a per-class weekly plan.
export const WEEK = [
  { d: "Mon", n: 28, topic: "Cell membranes", s: "done" },
  { d: "Tue", n: 29, topic: "Enzyme kinetics", s: "done" },
  { d: "Wed", n: 30, topic: "Intro to metabolism", s: "missed" },
  { d: "Thu", n: 1, topic: "Glycolysis", s: "done" },
  { d: "Fri", n: 2, topic: "Krebs cycle", s: "done" },
  { d: "Sat", n: 3, topic: "Exam 2 review", s: "done" },
  { d: "Sun", n: 4, topic: "Glycolysis", s: "today" },
] as const;

export const FILES = [
  ["BIOL2210_syllabus.pdf", "Sep 2", "12 topics from this file"],
  ["Lecture 5.pptx", "Sep 30", "2 topics from this file"],
];

// Needs: generated study guides.
export const GUIDE = {
  summary: "Glycolysis splits one glucose into two pyruvate in the cytosol. It spends 2 ATP to destabilize the sugar, then makes 4 ATP and 2 NADH as it breaks down. The net 2 ATP is small, but it runs without oxygen.",
  terms: [
    ["Phosphofructokinase-1", "The enzyme that catalyzes the committed step. Inhibited by ATP and citrate."],
    ["Substrate-level phosphorylation", "Making ATP by transferring a phosphate directly from a substrate."],
    ["NADH", "Electron carrier produced in the payoff phase; feeds the electron transport chain."],
  ],
  steps: [
    "Glucose is phosphorylated twice, using 2 ATP.",
    "Fructose-1,6-bisphosphate splits into two 3-carbon sugars.",
    "Each 3-carbon sugar is oxidized, producing NADH.",
    "Four ATP are made by substrate-level phosphorylation.",
    "Two pyruvate remain for the Krebs cycle.",
  ],
};

// Needs: quiz routes (quizSessions table exists, no route).
export const PAST_QUIZZES = [
  { date: "Sat, Oct 3", topic: "Cell membranes", s: 9 },
  { date: "Fri, Oct 2", topic: "Enzyme kinetics", s: 7 },
  { date: "Thu, Oct 1", topic: "Intro to metabolism", s: 6 },
];
export const QUESTION = {
  prompt: "Which enzyme catalyzes the committed step of glycolysis?",
  options: ["Hexokinase", "Phosphofructokinase-1", "Pyruvate kinase", "Aldolase"],
  correct: 1,
  why: "PFK-1 converts fructose-6-phosphate to fructose-1,6-bisphosphate. After this step the molecule can only continue down glycolysis, so it is the main control point.",
};
export const QUIZ_REVIEW = [
  { p: "Which molecule makes up most of the plasma membrane?", you: "Phospholipids", ok: true },
  { p: "What makes a phospholipid amphipathic?", you: "A polar head and nonpolar tails", ok: true },
  { p: "Which transport moves glucose into cells with Na⁺?", you: "Facilitated diffusion", right: "Secondary active transport (SGLT1)", ok: false, why: "SGLT1 uses the sodium gradient built by the Na⁺/K⁺ pump to pull glucose in against its gradient." },
  { p: "Cholesterol in the membrane does what at high temperature?", you: "Reduces fluidity", ok: true },
] as { p: string; you: string; right?: string; ok: boolean; why?: string }[];

export const FAQ = [
  ["Do I need to install anything?", "No. Recall texts you in iMessage and this site is your dashboard."],
  ["What can I upload?", "Syllabi and lecture slides as PDF, PPTX, or DOCX."],
  ["Who decides when I see a card?", "A scheduling algorithm (FSRS), not an AI guess."],
  ["Can I stop the texts?", "Yes. Pause them or change the time in Settings."],
];
