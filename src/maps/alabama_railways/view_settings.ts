import { MapViewSettings } from "../view_settings";
import { AlabamaRivers } from "./rivers";
import { AlabamaRailwaysRules } from "./rules";
import { AlabamaRailwaysMapSettings } from "./settings";
import { AlabamaRailwaysMoveInterceptorModal } from "./move_interceptor_modal";

export class AlabamaRailwaysViewSettings
  extends AlabamaRailwaysMapSettings
  implements MapViewSettings
{
  getMapRules = AlabamaRailwaysRules;

  getTexturesLayer = AlabamaRivers;

  moveInterceptModal = AlabamaRailwaysMoveInterceptorModal;
}
