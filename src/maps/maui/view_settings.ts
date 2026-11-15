import { MapViewSettings } from "../view_settings";
import { MauiOverlayLayer } from "./layers";
import { TurnTrackCubes } from "./turn_track";
import { MauiRules } from "./rules";
import { MauiMapSettings } from "./settings";

export class MauiViewSettings
  extends MauiMapSettings
  implements MapViewSettings
{
  getMapRules = MauiRules;
  getOverlayLayer = MauiOverlayLayer;
  additionalSliders = [TurnTrackCubes];
}
