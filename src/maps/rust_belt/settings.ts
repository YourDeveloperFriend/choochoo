import {MapSettings, ReleaseStage} from '../../engine/game/map_settings';
import {map} from './grid';
import {ReactNode} from "react";
import {RIVERS} from "./rivers";


export class RustBeltMapSettings implements MapSettings {
  readonly key = 'rust-belt';
  readonly name = 'Rust Belt';
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEPRECATED;

  getOverrides() {
    return [];
  }

  getMapRules() {
    return null;
  }

  getRiversLayer(): ReactNode {
    return RIVERS;
  }
}
