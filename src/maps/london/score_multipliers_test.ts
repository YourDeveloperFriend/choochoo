import { LondonPlayerHelper } from "./score";
import { InjectionHelper } from "../../testing/injection_helper";

describe("LondonPlayerHelper multipliers", () => {
  InjectionHelper.install();

  describe("getIncomeMultiplier", () => {
    it("returns 2 for London (instead of 3)", () => {
      const helper = new LondonPlayerHelper();
      const multiplier = helper.getIncomeMultiplier();
      expect(multiplier).toBe(2);
    });
  });

  describe("getSharesMultiplier", () => {
    it("returns -2 for London (instead of -3)", () => {
      const helper = new LondonPlayerHelper();
      const multiplier = helper.getSharesMultiplier();
      expect(multiplier).toBe(-2);
    });
  });
});
