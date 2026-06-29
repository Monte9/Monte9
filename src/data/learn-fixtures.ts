// Mock deck for the Learn feed — used in mock mode (?mock=1), local dev, and as
// the graceful fallback when the live /api/learn function errors. Cards span
// every v1 type (quiz/trivia/news) and Monte's topics. Kept factually correct;
// they double as worked examples for the generation prompt in Sprint 4.
import type { LearnCard } from "@/lib/learn-types";

export const LEARN_FIXTURES: LearnCard[] = [
  // ---- Quiz ----
  {
    id: "q-porsche-911-engine",
    type: "quiz",
    topic: "Porsche",
    difficulty: "easy",
    question: "Where is the engine mounted in a classic Porsche 911?",
    options: ["Front", "Mid", "Rear (behind the axle)", "Under the floor"],
    correctIndex: 2,
    explanation:
      "The 911 is famously rear-engined — the flat-six sits behind the rear axle. That weight-aft layout is why early 911s were tail-happy and why decades of chassis tuning went into taming lift-off oversteer.",
  },
  {
    id: "q-rome-rubicon",
    type: "quiz",
    topic: "Roman history",
    difficulty: "medium",
    question: "Crossing which river in 49 BC committed Caesar to civil war?",
    options: ["Tiber", "Rubicon", "Po", "Arno"],
    correctIndex: 1,
    explanation:
      "Bringing an army south of the Rubicon — the border of Italy proper — was treason. 'Alea iacta est' ('the die is cast') marks the point of no return; we still say 'crossing the Rubicon' for an irreversible choice.",
  },
  {
    id: "q-algo-binary-search",
    type: "quiz",
    topic: "Algorithms (L5)",
    difficulty: "medium",
    question: "What is the time complexity of binary search on a sorted array of n items?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctIndex: 1,
    explanation:
      "Each comparison halves the search space, so you need at most ⌈log₂ n⌉ steps — O(log n). The catch interviewers probe: it only works on sorted, randomly-accessible data (arrays, not linked lists).",
  },
  {
    id: "q-ds-hashmap-avg",
    type: "quiz",
    topic: "Data structures (L5)",
    difficulty: "medium",
    question: "Average-case lookup in a well-sized hash map is:",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correctIndex: 0,
    explanation:
      "With a good hash and a low load factor, lookups are amortized O(1). Worst case degrades to O(n) under heavy collisions — which is why interview answers should say 'O(1) average, O(n) worst.'",
  },
  {
    id: "q-moon-far-side",
    type: "quiz",
    topic: "The Moon",
    difficulty: "easy",
    question: "Why do we always see the same face of the Moon from Earth?",
    options: [
      "The Moon doesn't rotate",
      "It's tidally locked — rotation period equals its orbit",
      "Earth's shadow hides the rest",
      "It spins too fast to notice",
    ],
    correctIndex: 1,
    explanation:
      "The Moon is tidally locked: it rotates once per orbit (~27.3 days), so one hemisphere always faces us. The 'far side' isn't the 'dark side' — it gets just as much sunlight.",
  },
  {
    id: "q-pickleball-kitchen",
    type: "quiz",
    topic: "Pickleball",
    difficulty: "easy",
    question: "What can you NOT do while standing in the pickleball 'kitchen'?",
    options: [
      "Hit a groundstroke",
      "Volley the ball (hit it out of the air)",
      "Call the score",
      "Stand during a serve",
    ],
    correctIndex: 1,
    explanation:
      "The kitchen (non-volley zone, 7 ft from the net) bans volleys — you can't smash out of the air with your feet inside it. It's the rule that keeps the net from becoming an unstoppable kill zone.",
  },

  // ---- Trivia / did-you-know ----
  {
    id: "t-mars-olympus",
    type: "trivia",
    topic: "Mars",
    difficulty: "easy",
    fact: "Olympus Mons on Mars is ~22 km tall — about 2.5× the height of Mount Everest above sea level.",
    why: "Mars has no moving tectonic plates, so a volcano can sit over a hotspot and pile up for billions of years instead of drifting away. Low gravity lets the mountain grow taller before it collapses under its own weight.",
  },
  {
    id: "t-indian-mythology-samudra",
    type: "trivia",
    topic: "Indian mythology",
    difficulty: "medium",
    fact: "In the Samudra Manthan, gods and demons churn the cosmic ocean using a mountain as the churning rod and the serpent Vasuki as the rope.",
    why: "It's a vivid metaphor for cooperation under tension: opposing forces must pull together to produce amrita (the nectar of immortality) — and the poison that surfaces first (Halahala) has to be dealt with before the reward.",
  },
  {
    id: "t-systems-latency-numbers",
    type: "trivia",
    topic: "Systems engineering",
    difficulty: "hard",
    fact: "A main-memory reference takes ~100 ns; a round trip within the same datacenter is ~500,000 ns; a packet from California to the Netherlands and back is ~150,000,000 ns.",
    why: "These 'latency numbers every engineer should know' are why caching, batching, and data locality dominate system design — the gap between RAM and a cross-continent hop is ~6 orders of magnitude.",
  },
  {
    id: "t-geography-four-corners",
    type: "trivia",
    topic: "Geography",
    difficulty: "easy",
    fact: "The 'Four Corners' is the only point in the US where four states meet: Arizona, Colorado, New Mexico, and Utah.",
    why: "It exists because those borders were drawn as straight lines of latitude and longitude rather than along rivers or ridges — a very American, surveyor-drawn geometry you can literally stand on.",
  },
  {
    id: "t-startups-burn-runway",
    type: "trivia",
    topic: "Startups",
    difficulty: "medium",
    fact: "A startup's 'runway' = cash on hand ÷ net monthly burn — the number of months until it hits zero.",
    why: "It's the single most important number a founder tracks: it converts a scary bank balance into a deadline, and 'default alive vs default dead' (will you reach profitability on current runway?) reframes every spending decision.",
  },

  // ---- News (sample/static in mock; live + fresh from Sprint 5) ----
  {
    id: "n-ai-agents-reliability",
    type: "news",
    topic: "AI",
    difficulty: "medium",
    headline: "Why long-horizon AI agents still fail even at high per-step accuracy",
    summary:
      "Production agents chain dozens of tool calls, so per-step errors compound: 95% per step is only ~36% over 20 steps. New evals focus on silent errors and rollback, not single-shot leaderboards.",
    why: "If you're building or buying agents, the metric that predicts production success is step-scaled reliability and cost-of-error — not pass@1 on a short benchmark.",
    source: { name: "montethakkar.com/posts", url: "/posts/agent-reliability-tax" },
  },
  {
    id: "n-startups-ai-pricing",
    type: "news",
    topic: "Startups",
    difficulty: "medium",
    headline: "AI startups are shifting from seat-based to outcome-based pricing",
    summary:
      "As agents do work rather than assist humans, more companies are experimenting with charging per resolved task or outcome instead of per user seat.",
    why: "Pricing model is product strategy: outcome pricing aligns cost with value but makes revenue harder to forecast — a live tension for any founder building agentic products.",
  },
];
