import {MapSettings, ReleaseStage} from "../../engine/game/map_settings";
import {ExpensiveMountains} from "./costs";
import {IndiaBuildAction, IndiaUrbanizeAction} from "./goods_growth";
import {map} from "./grid";
import {IndiaIncomePhase} from "./monsoon";
import {IndiaPhaseDelegator, IndiaPhaseEngine} from "./production";

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
}
