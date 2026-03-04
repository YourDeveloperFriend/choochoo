import { PlayerHelper } from "./player";
import { InjectionHelper } from "../../testing/injection_helper";

describe("PlayerHelper multipliers", () => {
  InjectionHelper.install();

  describe("getIncomeMultiplier", () => {
    it("returns 3 for base game", () => {
      const helper = new PlayerHelper();
      const multiplier = helper.getIncomeMultiplier();
      expect(multiplier).toBe(3);
    });
  });

  describe("getSharesMultiplier", () => {
    it("returns -3 for base game", () => {
      const helper = new PlayerHelper();
      const multiplier = helper.getSharesMultiplier();
      expect(multiplier).toBe(-3);
    });
  });
});
