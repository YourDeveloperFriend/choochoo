import { KoreaWallaceRules } from "./rules";
import { KoreaWallaceMapSettings } from "./settings";
import { MapViewSettings } from "../view_settings";

export class KoreaWallaceViewSettings
  extends KoreaWallaceMapSettings
  implements MapViewSettings
{
  getMapRules = KoreaWallaceRules;
}
