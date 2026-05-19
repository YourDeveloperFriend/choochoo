import { ChicagoLPlayerHelper } from "./score";
import { InjectionHelper } from "../../testing/injection_helper";

describe("ChicagoLPlayerHelper multipliers", () => {
  InjectionHelper.install();

  describe("getIncomeMultiplier", () => {
    it("returns 2 for Chicago-L (instead of 3)", () => {
      const helper = new ChicagoLPlayerHelper();
      const multiplier = helper.getIncomeMultiplier();
      expect(multiplier).toBe(2);
    });
  });

  describe("getSharesMultiplier", () => {
    it("returns -2 for Chicago-L (instead of -3)", () => {
      const helper = new ChicagoLPlayerHelper();
      const multiplier = helper.getSharesMultiplier();
      expect(multiplier).toBe(-2);
    });
  });
});
