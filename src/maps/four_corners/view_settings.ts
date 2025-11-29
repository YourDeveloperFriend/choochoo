import { MapViewSettings } from "../view_settings";
import { FourCornersRules } from "./rules";
import { FourCornersMapSettings } from "./settings";
import { FourCornersRivers } from "./rivers";

import { capturedCubesColumn } from "./captured_cubes_column";

export class FourCornersViewSettings
  extends FourCornersMapSettings
  implements MapViewSettings
{
  getMapRules = FourCornersRules;
  getTexturesLayer = FourCornersRivers;
  getPlayerStatColumns() {
    return [capturedCubesColumn];
  }
}
