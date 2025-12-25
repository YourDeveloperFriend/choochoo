export const DIFFICULTY_LEVELS = [
  "novicio",
  "estudiante",
  "versado",
  "maestro",
  "conquistador",
  "dios",
] as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const DIFFICULTY_OPTIONS = DIFFICULTY_LEVELS.map((level) => ({
  text: level.charAt(0).toUpperCase() + level.slice(1),
  value: level,
}));
