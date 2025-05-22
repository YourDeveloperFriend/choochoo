import { BuildData } from "./build";
import { ClaimData } from "./claim";
import { ConnectCitiesData } from "./connect_cities";

/** Utility class for expansions to apply discounts to a build. */
export class BuildDiscountManager {
  getMinimumBuild(): number {
    return 2;
  }

  getDiscount(_: BuildData | ClaimData | ConnectCitiesData, __: number): number {
    return 0;
  }

  applyDiscount(_: BuildData | ClaimData | ConnectCitiesData, __: number): void {}

  onBuildRoundEnd(): void {}
}