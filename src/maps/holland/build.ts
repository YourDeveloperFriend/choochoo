import { Coordinates } from "../../utils/coordinates";
import { inject, injectState } from "../../engine/framework/execution_context";
import { GameMemory } from "../../engine/game/game_memory";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { ROUND } from "../../engine/game/round";
import { BuildCostCalculator } from "../../engine/build/cost";
import {
  BuildInfo,
  InvalidBuildReason,
  Validator,
} from "../../engine/build/validator";
import { Land } from "../../engine/map/location";
import { HollandMapData } from "./grid";
import { HollandVariantConfig } from "./variant_config";

export class HollandBuildValidator extends Validator {
  private readonly round = injectState(ROUND);
  private readonly playerCount = injectInitialPlayerCount();

  getInvalidBuildReason(
    coordinates: Coordinates,
    buildData: BuildInfo,
  ): InvalidBuildReason | undefined {
    const reason = super.getInvalidBuildReason(coordinates, buildData);
    if (reason !== undefined) {
      return reason;
    }

    const space = this.grid().get(coordinates);
    if (space instanceof Land) {
      const mapSpecific = space.getMapSpecific(HollandMapData.parse);
      if (mapSpecific?.polder && !this.isPolderAvailable()) {
        return "Polder spaces cannot be built on yet.";
      }
    }
    return undefined;
  }

  private isPolderAvailable(): boolean {
    return this.playerCount() === 3 ? this.round() >= 5 : this.round() >= 4;
  }
}

export class HollandBuildCostCalculator extends BuildCostCalculator {
  private readonly gameMemory = inject(GameMemory);

  protected getTerrainCost(location: Land): number {
    const mapSpecific = location.getMapSpecific(HollandMapData.parse);
    if (mapSpecific?.windmill) {
      const { windmillVariant } = this.gameMemory.getVariant(
        HollandVariantConfig.parse,
      );
      if (windmillVariant) {
        return 5;
      }
    }
    if (mapSpecific?.polder) {
      return 3;
    }
    return super.getTerrainCost(location);
  }
}
