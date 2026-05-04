import { MapViewSettings } from "../view_settings";
import { NorthernCaliforniaRules } from "./rules";
import { NorthernCaliforniaMapSettings } from "./settings";
import { NorthernCaliforniaTexturesLayer } from "./textures_layer";

export class NorthernCaliforniaViewSettings
  extends NorthernCaliforniaMapSettings
  implements MapViewSettings
{
  getMapRules = NorthernCaliforniaRules;
  getTexturesLayer = NorthernCaliforniaTexturesLayer;
}
