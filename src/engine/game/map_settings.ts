import { GameKey } from "../../api/game_key";
import { Coordinates } from "../../utils/coordinates";
import { assertNever } from "../../utils/validate";
import { SimpleConstructor } from "../framework/dependency_stack";
import { Grid, Space } from "../map/grid";
import { Module } from "../module/module";
import { GridData } from "../state/grid";
import { InterCityConnection } from "../state/inter_city_connection";
import { Direction } from "../state/tile";

export enum ReleaseStage {
  DEVELOPMENT = 1,
  ALPHA,
  BETA,
  PRODUCTION,
  DEPRECATED,
}

export function releaseStageToString(stage: ReleaseStage): string {
  switch (stage) {
    case ReleaseStage.DEVELOPMENT:
      return "Development";
    case ReleaseStage.ALPHA:
      return "Alpha";
    case ReleaseStage.BETA:
      return "Beta";
    case ReleaseStage.PRODUCTION:
      return "Production";
    case ReleaseStage.DEPRECATED:
      return "Deprecated";
    default:
      assertNever(stage);
  }
}

export enum Rotation {
  CLOCKWISE = 1,
  COUNTER_CLOCKWISE = 2,
}

export const KAOSKODY = 1;
export const JACK = 17;
export const GRIMIKU = 99;
export const EMIL = 375;
export const CORTEXBOMB = 387;

export interface MapSettings {
  readonly key: GameKey;
  readonly name: string;
  readonly designer: string;
  readonly implementerId: number;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly bestAt?: string;
  readonly recommendedPlayerCount?: string;
  readonly startingGrid: GridData;
  readonly interCityConnections?: InterCityConnection[];
  readonly stage: ReleaseStage;
  readonly rotation?: Rotation;
  // Development maps get an allowlist of user IDs who are allowed to create games for that map
  readonly developmentAllowlist?: number[];

  getOverrides(): Array<SimpleConstructor<unknown>>;
  getModules?(): Array<Module>;

  getNeighbor?: (
    grid: Grid,
    coordinates: Coordinates,
    dir: Direction,
  ) => Space | undefined;
}
