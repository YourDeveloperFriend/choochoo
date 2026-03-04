import { PlayerColor, PlayerData } from "../../engine/state/player";
import { useNewEnglandScoreBreakdown } from "./view_settings";

describe("useNewEnglandScoreBreakdown", () => {
  const COLOR = PlayerColor.BLUE;

  function playerData(data: Partial<PlayerData>): PlayerData {
    return { color: COLOR, ...data } as PlayerData;
  }

  describe("money bonus calculation", () => {
    it("returns empty array when player has no money", () => {
      const player = playerData({ money: 0 });
      const items = useNewEnglandScoreBreakdown(player);

      expect(items).toEqual([]);
    });

    it("returns correct bonus for money = 20", () => {
      const player = playerData({ money: 20 });
      const items = useNewEnglandScoreBreakdown(player);

      expect(items).toEqual([
        { label: "Money bonus ($20 ÷ 20):", value: 1 },
      ]);
    });

    it("returns correct bonus for money = 40", () => {
      const player = playerData({ money: 40 });
      const items = useNewEnglandScoreBreakdown(player);

      expect(items).toEqual([
        { label: "Money bonus ($40 ÷ 20):", value: 2 },
      ]);
    });

    it("returns correct bonus for money = 50", () => {
      const player = playerData({ money: 50 });
      const items = useNewEnglandScoreBreakdown(player);

      expect(items).toEqual([
        { label: "Money bonus ($50 ÷ 20):", value: 2 },
      ]);
    });

    it("returns correct bonus for money = 99", () => {
      const player = playerData({ money: 99 });
      const items = useNewEnglandScoreBreakdown(player);

      expect(items).toEqual([
        { label: "Money bonus ($99 ÷ 20):", value: 4 },
      ]);
    });

    it("returns correct bonus for money = 100", () => {
      const player = playerData({ money: 100 });
      const items = useNewEnglandScoreBreakdown(player);

      expect(items).toEqual([
        { label: "Money bonus ($100 ÷ 20):", value: 5 },
      ]);
    });
  });
});
