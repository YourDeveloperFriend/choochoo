import {MapSettings, ReleaseStage} from "../../engine/game/map_settings";
import {ExpensiveMountains} from "./costs";
import {IndiaBuildAction, IndiaUrbanizeAction} from "./goods_growth";
import {map} from "./grid";
import {IndiaIncomePhase} from "./monsoon";
import {IndiaPhaseDelegator, IndiaPhaseEngine} from "./production";
import {Action} from "../../engine/state/action";
import {IndiaRules} from "./rules";

export class IndiaMapSettings implements MapSettings {
  static readonly key = 'india';
  readonly key = IndiaMapSettings.key;
  readonly name = 'India';
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      ExpensiveMountains,
      IndiaIncomePhase,
      IndiaPhaseEngine,
      IndiaPhaseDelegator,
      IndiaBuildAction,
      IndiaUrbanizeAction,
    ];
  }

  getMapRules = IndiaRules

  getActionDescription(action: Action): string | undefined {
    if (action === Action.PRODUCTION) {
      return 'During the Goods Growth step, select a city, draw 2 goods, then place one of those goods in the selected city.';
    }
    return undefined;
  }
}