import {MapSettings, ReleaseStage} from '../../engine/game/map_settings';
import {GermanyCostCalculator} from './cost';
import {map} from './grid';
import {GermanyMoveHelper} from './move';
import {GermanyStarter} from './starter';
import {GermanyBuildAction, GermanyBuilderHelper, GermanyBuildPhase} from "./build";
import {interCityConnections} from '../factory';
import {Action} from "../../engine/state/action";
import {GermanyRules} from "./rules";

export class GermanyMapSettings implements MapSettings {
  static readonly key = 'germany';
  readonly key = GermanyMapSettings.key;
  readonly name = 'Germany';
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly interCityConnections = interCityConnections(map, [['Düsseldorf', 'Essen']])
  readonly stage = ReleaseStage.DEVELOPMENT;

  getOverrides() {
    return [
        GermanyCostCalculator,
        GermanyMoveHelper,
        GermanyStarter,
        GermanyBuilderHelper,
        GermanyBuildAction,
        GermanyBuildPhase,
    ];
  }

  getMapRules = GermanyRules;

  getActionDescription(action: Action): string | undefined {
    if (action === Action.ENGINEER) {
        return 'Build one tile (the most expensive one) at half price (rounded down).';
    }
    return undefined;
  }
}
