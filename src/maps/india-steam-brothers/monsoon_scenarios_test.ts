import { PlayerColor, PlayerData } from "../../engine/state/player";
import { useMonsoonScenarios } from "./monsoon_scenarios";

describe("useMonsoonScenarios (India)", () => {
  const COLOR = PlayerColor.BLUE;

  function playerData(data: Partial<PlayerData>): PlayerData {
    return { color: COLOR, ...data } as PlayerData;
  }

  it("returns all three monsoon scenarios with correct probabilities", () => {
    const mockPlayer = playerData({});
    const scenarios = useMonsoonScenarios(mockPlayer);

    expect(scenarios).toEqual([
      { description: "No monsoon", cost: 0, probability: "17% (1 in 6)" },
      { description: "Light monsoon", cost: 1, probability: "67% (2 in 3)" },
      { description: "Heavy monsoon", cost: 2, probability: "17% (1 in 6)" },
    ]);
  });

  it("have correct cost values representing monsoon expenses", () => {
    const scenarios = useMonsoonScenarios(playerData({}));

    expect(scenarios[0].cost).toBe(0);
    expect(scenarios[1].cost).toBe(1);
    expect(scenarios[2].cost).toBe(2);
  });
});
