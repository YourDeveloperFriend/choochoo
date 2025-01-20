import {MapSettings, ReleaseStage} from '../../engine/game/map_settings';
import {map} from './grid';
import {ReversteamRivers} from "./rivers";


export class ReversteamMapSettings implements MapSettings {
  readonly key = 'reversteam';
  readonly name = 'Reversteam';
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.BETA;

  getOverrides() {
    return [];
  }

  getMapRules() {
    return null;
  }

  getTexturesLayer = ReversteamRivers;
}
