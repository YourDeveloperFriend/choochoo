import { PlayerData } from "../../engine/state/player";

export function useMonsoonScenarios(_player: PlayerData) {
  // Monsoon costs based on die roll:
  // 1 = $0 (1 in 6 = 17%)
  // 2-5 = $1 (4 in 6 = 67%)
  // 6 = $2 (1 in 6 = 17%)
  return [
    { description: "No monsoon", cost: 0, probability: "17% (1 in 6)" },
    { description: "Light monsoon", cost: 1, probability: "67% (2 in 3)" },
    { description: "Heavy monsoon", cost: 2, probability: "17% (1 in 6)" },
  ];
}
