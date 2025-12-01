import { draw, GameStarter } from "../../engine/game/starter";
import { PlayerColorZod } from "../../engine/state/player";
import { Key, MapKey } from "../../engine/framework/key";
import z from "zod";
import { injectState } from "../../engine/framework/execution_context";
import { Good, GoodZod } from "../../engine/state/good";
import { assert } from "../../utils/validate";
import { SpaceType } from "../../engine/state/location_type";
import { CityData, SpaceData } from "../../engine/state/space";
import { AvailableCity } from "../../engine/state/available_city";

export const DoubleBaseUsaPlayerData = new MapKey(
  "DoubleBaseUsaPlayerData",
  PlayerColorZod.parse,
  z.object({
    landGrants: z.number(),
    locoDiscs: z.number(),
  }).parse,
);

export const StartingCityMarkers = new Key(
  "StartingCityMarkers",
  GoodZod.array(),
);
export const TranscontinentalBonusClaimed = new Key(
  "TranscontinentalBonusClaimed",
  z.boolean(),
);

export class DoubleBaseUsaStarter extends GameStarter {
  private readonly playerData = injectState(DoubleBaseUsaPlayerData);
  private readonly startingCityMarkers = injectState(StartingCityMarkers);
  private readonly transcontinentalBonusClaimed = injectState(
    TranscontinentalBonusClaimed,
  );

  protected onStartGame(): void {
    super.onStartGame();

    this.transcontinentalBonusClaimed.initState(false);
    this.playerData.initState(
      new Map(
        this.turnOrder().map((color) => [
          color,
          { landGrants: 0, locoDiscs: 2 },
        ]),
      ),
    );
    this.startingCityMarkers.initState([
      Good.BLUE,
      Good.YELLOW,
      Good.PURPLE,
      Good.RED,
      Good.RED,
      Good.BLACK,
      Good.BLACK,
    ]);

    if (this.turnOrder().length >= 6) {
      const montreal = this.grid()
        .toArray()
        .find(
          ([_, loc]) => loc.type === SpaceType.CITY && loc.name === "Montreal",
        );
      assert(montreal !== undefined);
      this.gridHelper.update(montreal[0], (space) => {
        space.mapSpecific = {
          startingCity: true,
        };
      });
    }
  }

  protected startingBag(): Good[] {
    const startingBag = super.startingBag();
    return [...startingBag, ...startingBag];
  }

  protected drawCubesFor(
    bag: Good[],
    location: SpaceData,
    playerCount: number,
  ): SpaceData {
    // Towns that start with a cube on this map are marked as such by an empty (but not undefined) goods array. See grid.ts.
    if (
      location.type !== SpaceType.CITY &&
      location.townName !== undefined &&
      location.goods !== undefined
    ) {
      return {
        ...location,
        goods: draw(1, bag),
      };
    }
    return super.drawCubesFor(bag, location, playerCount);
  }

  protected getPlacedGoodsFor(
    bag: Good[],
    playerCount: number,
    location: CityData,
  ): Good[] {
    const goods = super.getPlacedGoodsFor(bag, playerCount, location);

    if (playerCount >= 6) {
      if (
        location.color === Good.BLACK ||
        location.mapSpecific?.eastCoastCity === true
      ) {
        for (const good of draw(1, bag)) {
          goods.push(good);
        }
      }
    }

    return goods;
  }

  initializeAvailableCities(): void {
    const availableCities: AvailableCity[] = [
      { color: Good.RED, onRoll: [], goods: [] },
      { color: Good.BLUE, onRoll: [], goods: [] },
      { color: Good.BLACK, onRoll: [], goods: [] },
      { color: Good.BLACK, onRoll: [], goods: [] },
      { color: Good.YELLOW, onRoll: [], goods: [] },
      { color: Good.PURPLE, onRoll: [], goods: [] },
      { color: Good.BLACK, onRoll: [], goods: [] },
      { color: Good.BLACK, onRoll: [], goods: [] },

      { color: Good.RED, onRoll: [], goods: [] },
      { color: Good.BLUE, onRoll: [], goods: [] },
      { color: Good.BLACK, onRoll: [], goods: [] },
      { color: Good.BLACK, onRoll: [], goods: [] },
      { color: Good.YELLOW, onRoll: [], goods: [] },
      { color: Good.PURPLE, onRoll: [], goods: [] },
      { color: Good.BLACK, onRoll: [], goods: [] },
      { color: Good.BLACK, onRoll: [], goods: [] },
    ];
    this.availableCities.initState(availableCities);
  }
}
