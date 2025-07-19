import { MapViewSettings } from "../view_settings";
import { RustBeltRivers } from "./rivers";
import { BalkanMapSettings } from "./settings";

export class BalkanViewSettings
  extends BalkanMapSettings
  implements MapViewSettings
{
  getTexturesLayer = RustBeltRivers;

  getMapRules() {
    return <p>No changes from base game.</p>;
  }
}
