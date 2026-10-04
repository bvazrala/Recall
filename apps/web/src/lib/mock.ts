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

// Placeholder history until the server exposes past quizzes.
export const PAST_QUIZZES = [
  { id: "cell-membranes", date: "Sat, Oct 3", topic: "Cell membranes", s: 9 },
  { id: "enzyme-kinetics", date: "Fri, Oct 2", topic: "Enzyme kinetics", s: 7 },
  { id: "intro-to-metabolism", date: "Thu, Oct 1", topic: "Intro to metabolism", s: 6 },
];
export const QUESTION = {
  prompt: "Which enzyme catalyzes the committed step of glycolysis?",
  options: ["Hexokinase", "Phosphofructokinase-1", "Pyruvate kinase", "Aldolase"],
  correct: 1,
  why: "PFK-1 converts fructose-6-phosphate to fructose-1,6-bisphosphate. After this step the molecule can only continue down glycolysis, so it is the main control point.",
};
export type QuizReviewQuestion = { p: string; you: string; right?: string; ok: boolean; why?: string };

// Demo review content, keyed by the same stable IDs used in the history list.
export const QUIZ_REVIEWS: Record<string, QuizReviewQuestion[]> = {
  "cell-membranes": [
    { p: "Which molecules form the membrane bilayer?", you: "Phospholipids", ok: true },
    { p: "What makes a phospholipid amphipathic?", you: "A polar head and nonpolar tails", ok: true },
    { p: "Which transport moves glucose into cells with Na⁺?", you: "Facilitated diffusion", right: "Secondary active transport (SGLT1)", ok: false, why: "SGLT1 uses the sodium gradient built by the Na⁺/K⁺ pump to pull glucose in against its gradient." },
    { p: "Cholesterol in the membrane does what at high temperature?", you: "Reduces fluidity", ok: true },
    { p: "What powers the sodium-potassium pump?", you: "ATP hydrolysis", ok: true },
    { p: "Which molecules readily cross the lipid bilayer?", you: "Small nonpolar molecules", ok: true },
    { p: "What is osmosis?", you: "Movement of water across a selectively permeable membrane", ok: true },
    { p: "Which membrane proteins span the bilayer?", you: "Transmembrane proteins", ok: true },
    { p: "What happens to an animal cell in a hypotonic solution?", you: "It swells as water enters", ok: true },
    { p: "How does facilitated diffusion move solutes?", you: "Down their gradient through membrane proteins", ok: true },
  ],
  "enzyme-kinetics": [
    { p: "How do enzymes speed up reactions?", you: "They lower activation energy", ok: true },
    { p: "What does Vmax describe?", you: "The maximum reaction rate at saturating substrate", ok: true },
    { p: "At what substrate concentration is the rate half of Vmax?", you: "Km", ok: true },
    { p: "How does competitive inhibition affect apparent Km?", you: "It decreases", right: "It increases", ok: false, why: "More substrate is needed to reach half of Vmax when an inhibitor competes for the active site." },
    { p: "How does competitive inhibition affect Vmax?", you: "Vmax stays the same", ok: true },
    { p: "How does pure noncompetitive inhibition affect Vmax?", you: "It stays the same", right: "It decreases", ok: false, why: "Pure noncompetitive inhibition reduces the available catalytic activity." },
    { p: "What does kcat measure?", you: "Substrate molecules converted per enzyme active site per second at saturation", ok: true },
    { p: "Can enzymes change a reaction's equilibrium constant?", you: "Yes", right: "No", ok: false, why: "Enzymes accelerate both directions without changing the equilibrium constant." },
    { p: "What happens to the initial rate if enzyme concentration doubles at saturating substrate?", you: "It doubles", ok: true },
    { p: "What is the substrate-binding region of an enzyme called?", you: "The active site", ok: true },
  ],
  "intro-to-metabolism": [
    { p: "What is catabolism?", you: "Breaking down molecules to release energy", ok: true },
    { p: "What is anabolism?", you: "Building complex molecules using energy", ok: true },
    { p: "Which molecule commonly couples energy release to cellular work?", you: "ATP", ok: true },
    { p: "What does a negative change in Gibbs free energy indicate?", you: "An endergonic reaction", right: "An exergonic reaction", ok: false, why: "A negative free-energy change means the reaction is thermodynamically favorable under those conditions." },
    { p: "Where does glycolysis occur?", you: "The cytosol", ok: true },
    { p: "What is the net ATP yield of glycolysis per glucose?", you: "Four ATP", right: "Two ATP", ok: false, why: "Glycolysis makes four ATP but consumes two, leaving a net yield of two." },
    { p: "What do NADH and FADH₂ carry?", you: "High-energy electrons", ok: true },
    { p: "What is the final electron acceptor in aerobic respiration?", you: "Carbon dioxide", right: "Oxygen", ok: false, why: "Oxygen accepts electrons at the end of the electron transport chain and is reduced to water." },
    { p: "What drives ATP synthase during oxidative phosphorylation?", you: "A proton electrochemical gradient", ok: true },
    { p: "What is substrate-level phosphorylation?", you: "ATP synthesis powered directly by the proton gradient", right: "Direct transfer of a phosphate group from a substrate to ADP", ok: false, why: "Substrate-level phosphorylation makes ATP by phosphate transfer rather than by ATP synthase." },
  ],
};

export const FAQ = [
  ["Do I need to install anything?", "No. Recall texts you in iMessage and this site is your dashboard."],
  ["What can I upload?", "Syllabi and lecture slides as PDF, PPTX, or DOCX."],
  ["Who decides when I see a card?", "A scheduling algorithm (FSRS), not an AI guess."],
  ["Can I stop the texts?", "Yes. Pause them or change the time in Settings."],
];
