import { injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { City } from "../../engine/map/city";
import { PlayerColor } from "../../engine/state/player";
import { MauiCityData } from "./map_data";
import { TURN_TRACK_CUBES } from "./state";

/**
 * There is no Production, one fewer die is rolled than the number of players, designated
 * cities receive cubes from the bag every turn, and on turns 2-4 the cube from the turn
 * track is placed into Hāna.
 */
export class MauiGoodsGrowthPhase extends GoodsGrowthPhase {
  private readonly round = injectState(ROUND);
  private readonly turnTrackCubes = injectState(TURN_TRACK_CUBES);

  getPlayerOrder(): PlayerColor[] {
    return [];
  }

  getRollCount(): number {
    return Math.max(0, this.playerCount() - 1);
  }

  onEnd(): void {
    super.onEnd();
    this.addCubesFromBag();
    this.addTurnTrackCube();
  }

  private addCubesFromBag(): void {
    for (const city of this.gridHelper.findAllCities()) {
      const draws = city.getMapSpecific(MauiCityData.parse)?.growthDraws ?? 0;
      for (const good of this.helper.drawGoods(draws)) {
        this.helper.addGoodToCity(city.coordinates, good);
      }
    }
  }

  private addTurnTrackCube(): void {
    const index = this.round() - 1;
    if (!this.turnTrackCubes.isInitialized()) {
      return;
    }
    const good = this.turnTrackCubes()[index];
    if (good == null) {
      return;
    }
    const hana = [...this.gridHelper.findAllCities()].find(isHana);
    if (hana === undefined) {
      return;
    }
    this.helper.addGoodToCity(hana.coordinates, good);
    this.turnTrackCubes.update((cubes) => {
      cubes[index] = null;
    });
  }
}

export function isHana(city: City): boolean {
  return city.getMapSpecific(MauiCityData.parse)?.cubeCollector === true;
}
