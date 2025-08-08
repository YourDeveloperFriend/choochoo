import { duplicate, partition } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { GridHelper } from "../map/grid_helper";
import { GridVersionHelper } from "../map/grid_version_helper";
import { AvailableCity } from "../state/available_city";
import { CityGroup } from "../state/city_group";
import { Good } from "../state/good";
import { GridData } from "../state/grid";
import { InterCityConnection } from "../state/inter_city_connection";
import { SpaceType } from "../state/location_type";
import { eligiblePlayerColors, PlayerColor, PlayerData } from "../state/player";
import { OnRoll } from "../state/roll";
import { CityData, SpaceData } from "../state/space";
import { Random } from "./random";
import {
  AVAILABLE_CITIES,
  BAG,
  GRID,
  injectAllPlayersUnsafe,
  INTER_CITY_CONNECTIONS,
  TURN_ORDER,
} from "./state";

export interface PlayerUser {
  playerId: number;
  preferredColors?: PlayerColor[];
}

export class GameStarter {
  protected readonly gridVersionHelper = inject(GridVersionHelper);
  protected readonly grid = injectState(GRID);
  protected readonly interCityConnections = injectState(INTER_CITY_CONNECTIONS);
  protected readonly turnOrder = injectState(TURN_ORDER);
  protected readonly players = injectAllPlayersUnsafe();
  protected readonly bag = injectState(BAG);
  protected readonly availableCities = injectState(AVAILABLE_CITIES);
  protected readonly gridHelper = inject(GridHelper);
  protected readonly random = inject(Random);

  startGame(
    players: PlayerUser[],
    startingMap: GridData,
    connections: InterCityConnection[],
  ) {
    this.onBeginStartGame();
    this.initializeStartingCubes();
    this.drawCubesForCities(startingMap, players.length);
    this.initializePlayers(players);
    this.initializeAvailableCities();
    this.interCityConnections.initState(connections);
    this.onStartGame();
  }

  protected onBeginStartGame(): void {}

  protected onStartGame(): void {}

  protected startingBag(): Good[] {
    return [
      ...duplicate(20, Good.RED),
      ...duplicate(20, Good.PURPLE),
      ...duplicate(20, Good.YELLOW),
      ...duplicate(20, Good.BLUE),
      ...duplicate(16, Good.BLACK),
    ];
  }

  initializeStartingCubes() {
    this.bag.initState(this.random.shuffle(this.startingBag()));
  }

  drawCubesForCities(startingMap: GridData, playerCount: number) {
    const bag = [...this.bag()];
    this.grid.initState(new Map());
    for (const [coordinates, location] of startingMap.entries()) {
      this.gridHelper.set(
        coordinates,
        this.drawCubesFor(bag, location, playerCount),
      );
    }
    this.bag.set(bag);
    this.gridVersionHelper.updateGridVersion();
  }

  protected drawCubesFor(
    bag: Good[],
    location: SpaceData,
    playerCount: number,
  ): SpaceData {
    if (location.type !== SpaceType.CITY) return location;
    return {
      ...location,
      goods: this.getPlacedGoodsFor(bag, playerCount, location),
      onRoll: location.onRoll.map((onRollData) => ({
        ...onRollData,
        goods: this.getGoodsGrowthGoodsFor(bag, location.color, false),
      })),
    };
  }

  protected getPlacedGoodsFor(
    bag: Good[],
    playerCount: number,
    location: CityData,
  ): Good[] {
    const numCubes =
      location.startingNumCubes ??
      (location.startingNumCubesPerPlayer != null
        ? location.startingNumCubesPerPlayer * playerCount
        : 0);
    return draw(numCubes, bag);
  }

  eligiblePlayerColors(): PlayerColor[] {
    return eligiblePlayerColors;
  }

  initializePlayers(playerUsers: PlayerUser[]) {
    const shuffledColors = new Set(
      this.random.shuffle(this.eligiblePlayerColors()),
    );
    const map = partition(playerUsers, (u) => u.preferredColors != null);
    const playersShuffled = this.random
      .shuffle(map.get(true) ?? [])
      .concat(map.get(false) ?? []);

    const players: PlayerData[] = [];
    for (const playerUser of playersShuffled) {
      const chosenColor =
        playerUser.preferredColors?.find((c) => shuffledColors.has(c)) ??
        shuffledColors[Symbol.iterator]().next().value;
      assert(chosenColor != null);
      players.push(this.buildPlayer(playerUser.playerId, chosenColor));
      shuffledColors.delete(chosenColor);
    }

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

  protected numCubesForAvailableCity(): number {
    return 0;
  }

  initializeAvailableCities() {
    const bag = [...this.bag()];
    const availableCities: AvailableCity[] = this.getAvailableCities().map(
      ([color, group, onRoll]) => ({
        color,
        onRoll: [
          {
            goods: this.getGoodsGrowthGoodsFor(bag, color, true),
            group,
            onRoll,
          },
        ],
        goods: draw(this.numCubesForAvailableCity(), bag),
      }),
    );
    this.availableCities.initState(availableCities);
    this.bag.set(bag);
  }

  protected getGoodsGrowthGoodsFor(
    bag: Good[],
    cityColor: Good | Good[],
    urbanized: boolean,
  ): Array<undefined | Good> {
    if (!this.isGoodsGrowthEnabled()) return [];
    return draw(urbanized ? 2 : 3, bag);
  }

  isGoodsGrowthEnabled(): boolean {
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
  assert(arr.length >= num, "drew too many!");
  return duplicate(num, arr[0]).map((_) => arr.pop()!);
}
