import { duplicate } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { GridHelper } from "../map/grid_helper";
import { AvailableCity } from "../state/available_city";
import { CityGroup } from "../state/city_group";
import { Good } from "../state/good";
import { GridData } from "../state/grid";
import { InterCityConnection } from "../state/inter_city_connection";
import { SpaceType } from "../state/location_type";
import { allPlayerColors, PlayerColor, PlayerData } from "../state/player";
import { OnRoll } from "../state/roll";
import { SpaceData } from "../state/space";
import { Random } from "./random";
import {
  AVAILABLE_CITIES,
  BAG,
  GRID,
  injectAllPlayersUnsafe,
  INTER_CITY_CONNECTIONS,
  TURN_ORDER,
} from "./state";

export class GameStarter {
  protected readonly grid = injectState(GRID);
  protected readonly interCityConnections = injectState(INTER_CITY_CONNECTIONS);
  protected readonly turnOrder = injectState(TURN_ORDER);
  protected readonly players = injectAllPlayersUnsafe();
  protected readonly bag = injectState(BAG);
  protected readonly availableCities = injectState(AVAILABLE_CITIES);
  protected readonly gridHelper = inject(GridHelper);
  protected readonly random = inject(Random);

  startGame(
    playerIds: number[],
    startingMap: GridData,
    connections: InterCityConnection[],
  ) {
    this.onBeginStartGame();
    this.initializeStartingCubes();
    this.drawCubesForCities(startingMap);
    this.initializePlayers(playerIds);
    this.initializeAvailableCities();
    this.interCityConnections.initState(connections);
    this.onStartGame();
  }

  protected onBeginStartGame(): void {}

  protected onStartGame(): void {}

  initializeStartingCubes() {
    this.bag.initState(
      this.random.shuffle([
        ...duplicate(20, Good.RED),
        ...duplicate(20, Good.PURPLE),
        ...duplicate(20, Good.YELLOW),
        ...duplicate(20, Good.BLUE),
        ...duplicate(16, Good.BLACK),
      ]),
    );
  }

  drawCubesForCities(startingMap: GridData) {
    const bag = [...this.bag()];
    this.grid.initState(new Map());
    for (const [coordinates, location] of startingMap.entries()) {
      this.gridHelper.set(coordinates, this.drawCubesFor(bag, location));
    }
    this.bag.set(bag);
  }

  protected drawCubesFor(bag: Good[], location: SpaceData): SpaceData {
    if (location.type !== SpaceType.CITY) return location;
    return {
      ...location,
      goods: draw(location.startingNumCubes ?? 0, bag),
      onRoll: location.onRoll.map((onRollData) => ({
        ...onRollData,
        goods: this.getDrawnCubesFor(bag, false),
      })),
    };
  }

  allPlayerColors(): PlayerColor[] {
    return allPlayerColors;
  }

  initializePlayers(playerIds: number[]) {
    const shuffledColors = this.random.shuffle(this.allPlayerColors());
    const players = playerIds.map((id, index) =>
      this.buildPlayer(id, shuffledColors[index]),
    );

    this.players.initState(players);
    this.turnOrder.initState(
      this.random.shuffle(players).map((player) => player.color),
    );
  }

  getAvailableCities(): Array<[Good | Good[], CityGroup, OnRoll]> {
    return [
      [Good.RED, CityGroup.WHITE, 3],
      [Good.BLUE, CityGroup.WHITE, 4],
      [Good.BLACK, CityGroup.WHITE, 5],
      [Good.BLACK, CityGroup.WHITE, 6],
      [Good.YELLOW, CityGroup.BLACK, 1],
      [Good.PURPLE, CityGroup.BLACK, 2],
      [Good.BLACK, CityGroup.BLACK, 3],
      [Good.BLACK, CityGroup.BLACK, 4],
    ];
  }

  initializeAvailableCities() {
    const bag = [...this.bag()];
    const availableCities: AvailableCity[] = this.getAvailableCities().map(
      ([color, group, onRoll]) => ({
        color,
        onRoll: [
          {
            goods: this.getDrawnCubesFor(bag, true),
            group,
            onRoll,
          },
        ],
        goods: [],
      }),
    );
    this.availableCities.initState(availableCities);
    this.bag.set(bag);
  }

  protected getDrawnCubesFor(bag: Good[], urbanized: boolean): Good[] {
    if (!this.isProductionEnabled()) return [];
    return draw(urbanized ? 2 : 3, bag);
  }

  protected isProductionEnabled(): boolean {
    return true;
  }

  protected buildPlayer(playerId: number, color: PlayerColor): PlayerData {
    return {
      playerId,
      color,
      income: 0,
      shares: 2,
      money: 10,
      locomotive: 1,
    };
  }
}


export function draw<T>(num: number, arr: T[]): T[] {
  assert(arr.length >= num, 'drew too many!');
  return duplicate(num, arr[0]).map((_) => arr.pop()!);
}
