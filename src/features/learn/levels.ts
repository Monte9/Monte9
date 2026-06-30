// Progress levels keyed off total sets completed — doubling so early levels
// come fast, capped at 64. Each set ≈ 5 cards / ~2 min.
export const LEVELS = [
  { name: "Novice", min: 0 },
  { name: "Curious", min: 2 },
  { name: "Apprentice", min: 4 },
  { name: "Scholar", min: 8 },
  { name: "Savant", min: 16 },
  { name: "Brainiac", min: 32 },
  { name: "Brain Master", min: 64 },
];

export type Level = (typeof LEVELS)[number];

export function levelFor(sets: number) {
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (sets >= LEVELS[k].min) i = k;
  const current = LEVELS[i];
  const next = LEVELS[i + 1] ?? null;
  const progress = next
    ? Math.min(1, (sets - current.min) / (next.min - current.min))
    : 1;
  const remaining = next ? Math.max(0, next.min - sets) : 0;
  return { current, next, progress, remaining };
}
