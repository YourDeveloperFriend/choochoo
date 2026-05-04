import { MapViewSettings } from "../view_settings";
import { DCMetroMoveInterceptorModal } from "./move_intercept_modal";
import { useProductionClick } from "./production_click";
import { DCMetroRivers } from "./rivers";
import { DCMetroRules } from "./rules";
import { DCMetroMapSettings } from "./settings";

export class DCMetroViewSettings
  extends DCMetroMapSettings
  implements MapViewSettings
{
  getMapRules = DCMetroRules;
  useOnMapClick = useProductionClick;
  moveInterceptModal = DCMetroMoveInterceptorModal;
  getTexturesLayer = DCMetroRivers;
}
