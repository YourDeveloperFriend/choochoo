import { BuildData } from "./build";

/** Utility class for expansions to apply discounts to a build. */
export class BuildDiscountManager {
  getDiscount(_: BuildData): number {
    return 0;
  }

  applyDiscount(_: BuildData): void {}
}