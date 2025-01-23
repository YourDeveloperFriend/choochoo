import { MapSettings, ReleaseStage } from '../../engine/game/map_settings';
import { map } from './grid';
import { CyprusAllowedActions } from './limitted_selection';
import { CyprusMoveAction } from './move_goods';
import { ShortBuild } from './short_build';
import { CyprusStarter } from './starter';


export class CyprusMapSettings implements MapSettings {
  static readonly key = 'cyprus';
  readonly key = CyprusMapSettings.key;
  readonly name = 'Cyprus';
  readonly minPlayers = 3;
  readonly maxPlayers = 3;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      CyprusAllowedActions,
      ShortBuild,
      CyprusStarter,
      CyprusMoveAction,
    ];
  }
}
