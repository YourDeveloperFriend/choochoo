
import { assertNever } from "../../utils/validate";
import { InjectionContext } from "../framework/inject";
import { InitialMapGrid } from "../state/map_settings";

export enum ReleaseStage {
  DEVELOPMENT = 1,
  ALPHA,
  BETA,
  PRODUCTION,
  DEPRECATED,
}

export function releaseStageToString(stage: ReleaseStage): string {
  switch (stage) {
    case ReleaseStage.DEVELOPMENT: return 'Development';
    case ReleaseStage.ALPHA: return 'Alpha';
    case ReleaseStage.BETA: return 'Beta';
    case ReleaseStage.PRODUCTION: return 'Production';
    case ReleaseStage.DEPRECATED: return 'Deprecated';
    default:
      assertNever(stage);
  }
}

export interface MapSettings {
  readonly key: string;
  readonly name: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly startingGrid: InitialMapGrid;
  readonly stage: ReleaseStage;

  registerOverrides(ctx: InjectionContext): void;
}