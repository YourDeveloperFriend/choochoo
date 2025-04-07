import { GameKey } from "../../api/game_key";
import { Coordinates } from "../../utils/coordinates";
import { assertNever } from "../../utils/validate";
import { SimpleConstructor } from "../framework/dependency_stack";
import { Grid, Space } from "../map/grid";
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

export interface MapSettings {
  readonly key: GameKey;
  readonly name: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly bestAt?: string;
  readonly recommendedPlayerCount?: string;
  readonly startingGrid: GridData;
  readonly interCityConnections?: InterCityConnection[];
  readonly stage: ReleaseStage;
  readonly rotation?: Rotation;

  getOverrides(): Array<SimpleConstructor<unknown>>;

  getNeighbor?: (grid: Grid, coordinates: Coordinates, dir: Direction) => Space | undefined;
}
