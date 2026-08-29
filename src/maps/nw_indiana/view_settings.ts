import { MapViewSettings } from "../view_settings";
import { IssueShareForMoney } from "./issue-share-for-money";
import { NwIndianaRules } from "./rules";
import { NwIndianaMapSettings } from "./settings";
import { NwIndianaOverlayLayer } from "./rivers";

export class NwIndianaViewSettings
  extends NwIndianaMapSettings
  implements MapViewSettings
{
  getMapRules = NwIndianaRules;
  getOverlayLayer = NwIndianaOverlayLayer;
  additionalSliders = [IssueShareForMoney];
}
