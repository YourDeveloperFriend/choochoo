import { MapViewSettings } from "../view_settings";
import { FourCornersRules } from "./rules";
import { FourCornersMapSettings } from "./settings";
import { FourCornersRivers } from "./rivers";
import * as styles from "./four_corners.module.css";
import { CANYON_STYLE } from "./grid";

import { capturedCubesColumn } from "./captured_cubes_column";

export class FourCornersViewSettings
  extends FourCornersMapSettings
  implements MapViewSettings
{
  getMapRules = FourCornersRules;
  getTexturesLayer = FourCornersRivers;

  getLandStyles = () => ({
    [CANYON_STYLE]: styles.canyon,
  });

  getPlayerStatColumns() {
    return [capturedCubesColumn];
  }
}
