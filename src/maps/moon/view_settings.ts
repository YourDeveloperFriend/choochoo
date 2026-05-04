import { MapViewSettings } from "../view_settings";
import { MoonRules } from "./rules";
import { MoonMapSettings } from "./settings";
import { MoonTextures } from "./textures";
import { MoonMoveInterceptorModal } from "./move_interceptor_modal";

export class MoonViewSettings
  extends MoonMapSettings
  implements MapViewSettings
{
  getMapRules = MoonRules;

  getTexturesLayer = MoonTextures;

  moveInterceptModal = MoonMoveInterceptorModal;
}
