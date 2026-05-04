import { MapViewSettings } from "../view_settings";
import { BalkanRivers } from "./rivers";
import { BalkanMapSettings } from "./settings";

export class BalkanViewSettings
  extends BalkanMapSettings
  implements MapViewSettings
{
  getTexturesLayer = BalkanRivers;

  getMapRules() {
    // TODO: add the Roma action.
    return <p>No changes from base game.</p>;
  }
}
