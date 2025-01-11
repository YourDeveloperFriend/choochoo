

import { MapSettings, ReleaseStage } from '../../engine/game/map_settings';
import { interCityConnections } from '../factory';
import { map } from './grid';


export class KoreaMapSettings implements MapSettings {
  static readonly key = 'korea';
  readonly key = KoreaMapSettings.key;
  readonly name = 'Korea';
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly interCityConnections = interCityConnections(map, [['Inchon', 'Suwon'], ['Suwon', 'Seoul']])
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
    ];
  }
}