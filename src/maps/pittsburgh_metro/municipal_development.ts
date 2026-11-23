import z from "zod";
import { CoordinatesZod } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { draw, GameStarter } from "../../engine/game/starter";
import { Log } from "../../engine/game/log";
import { ROUND } from "../../engine/game/round";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { GridHelper } from "../../engine/map/grid_helper";
import { Land } from "../../engine/map/location";
import { SharesPhase } from "../../engine/shares/phase";
import { MutableAvailableCity } from "../../engine/state/available_city";
import { Good, goodToString } from "../../engine/state/good";
import { duplicate } from "../../utils/functions";
import { SpaceType } from "../../engine/state/location_type";
import { Coordinates } from "../../utils/coordinates";
import { CityData } from "../../engine/state/space";

const PendingDevelopment = z.object({
  coordinates: CoordinatesZod,
  city: MutableAvailableCity,
});
type PendingDevelopment = z.infer<typeof PendingDevelopment>;

/** The town/new-city pairings, in the order they will be applied. */
export const MUNICIPAL_DEVELOPMENTS = new Key(
  "pittsburghMetroMunicipalDevelopments",
  {
    parse: PendingDevelopment.array().parse,
  },
);

/** How many towns are urbanized in round 1; every later round urbanizes one. */
function firstRoundCount(playerCount: number): number {
  switch (playerCount) {
    case 3:
      return 0;
    case 4:
      return 1;
    case 5:
      return 2;
    default:
      assert(false, "unsupported player count");
  }
}

export class PittsburghMetroStarter extends GameStarter {
  private readonly playerCount = injectInitialPlayerCount();
  private readonly municipalDevelopments = injectState(MUNICIPAL_DEVELOPMENTS);

  protected getPlacedGoodsFor(
    bag: Good[],
    playerCount: number,
    location: CityData,
  ): Good[] {
    const colors = Array.isArray(location.color)
      ? location.color
      : [location.color];
    if (colors.includes(Good.WHITE)) {
      return draw(playerCount === 3 ? 2 : 3, bag);
    }
    return super.getPlacedGoodsFor(bag, playerCount, location);
  }

  protected numCubesForAvailableCity(): number {
    return this.playerCount() === 3 ? 2 : 3;
  }

  protected startingBag(): Good[] {
    return [
      ...duplicate(16, Good.RED),
      ...duplicate(16, Good.PURPLE),
      ...duplicate(16, Good.YELLOW),
      ...duplicate(16, Good.BLUE),
      ...duplicate(16, Good.BLACK),
      ...duplicate(14, Good.WHITE),
    ];
  }

  isGoodsGrowthEnabled(): boolean {
    return false;
  }

  onStartGame(): void {
    const towns: Coordinates[] = [];
    for (const [coordinates, space] of this.grid().entries()) {
      if (space.type !== SpaceType.CITY && space.townName != null) {
        towns.push(coordinates);
      }
    }
    const shuffledTowns = this.random.shuffle(towns);
    const shuffledCities = this.random.shuffle(this.availableCities());
    assert(shuffledTowns.length >= shuffledCities.length);
    this.municipalDevelopments.initState(
      shuffledCities.map((city, i) => ({
        coordinates: shuffledTowns[i],
        city,
      })),
    );
    // New cities are only placed automatically, never by the players.
    this.availableCities.set([]);
  }
}

export class PittsburghMetroSharesPhase extends SharesPhase {
  private readonly municipalDevelopments = injectState(MUNICIPAL_DEVELOPMENTS);
  private readonly round = injectState(ROUND);
  private readonly playerCount = injectInitialPlayerCount();
  private readonly gridHelper = inject(GridHelper);
  private readonly log = inject(Log);

  onStart(): void {
    super.onStart();
    for (let i = 0; i < this.countForRound(); i++) {
      const next = this.municipalDevelopments()[0];
      if (next == null) {
        return;
      }
      this.municipalDevelopments.update((list) => {
        list.shift();
      });
      this.develop(next);
    }
  }

  private countForRound(): number {
    return this.round() === 1 ? firstRoundCount(this.playerCount()) : 1;
  }

  private develop({ coordinates, city }: PendingDevelopment): void {
    const location = this.gridHelper.lookup(coordinates);
    assert(location instanceof Land && location.hasTown());
    this.gridHelper.set(coordinates, {
      type: SpaceType.CITY,
      name: location.name()!,
      color: city.color,
      goods: city.goods.concat(location.getGoods()),
      urbanized: true,
      onRoll: city.onRoll,
      mapSpecific: location.data.mapSpecific,
    });
    const color = Array.isArray(city.color) ? city.color[0] : city.color;
    this.log.log(
      `${this.gridHelper.displayName(coordinates)} is urbanized into a ${goodToString(color)} city`,
    );
  }
}
