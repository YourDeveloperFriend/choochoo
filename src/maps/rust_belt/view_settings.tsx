import { MapViewSettings } from "../view_settings";
import { RustBeltRivers } from "./rivers";
import { RustBeltMapSettings } from "./settings";

export class RustBeltViewSettings
  extends RustBeltMapSettings
  implements MapViewSettings
{
  getTexturesLayer = RustBeltRivers;

  getMapRules() {
    return <p>No changes from base game.</p>;
  }
}
