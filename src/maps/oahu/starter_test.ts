import { describe, expect, it } from "vitest";
import { PlayerColor } from "../../engine/state/player";
import { startGame } from "../../testing/harness/test_game";
import { OahuMapSettings } from "./settings";

const { RED, BLUE, GREEN, YELLOW, PURPLE } = PlayerColor;

describe("O'ahu starter", () => {
  it("places 3 cubes in each double-hex city at 5 players, not 3 per hex", () => {
    const game = startGame(new OahuMapSettings().key, {
      players: [RED, BLUE, GREEN, YELLOW, PURPLE],
      seed: "oahu-5p-cubes",
    });
    const cities = game
      .snapshot()
      .spaces.filter((space) => space.kind === "city");
    const cubes = (names: string[]) =>
      cities
        .filter((city) => names.includes(city.name ?? ""))
        .reduce((sum, city) => sum + (city.goods?.length ?? 0), 0);
    expect(cubes(["Waipahu", "Pearl City"])).toBe(3);
    expect(cubes(["Honolulu", ""])).toBe(3);
  });
});
