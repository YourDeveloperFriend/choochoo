import { MapViewSettings } from "../view_settings";
import { ReversteamRivers } from "./rivers";
import { ReversteamMapSettings } from "./settings";

export class ReversteamViewSettings
  extends ReversteamMapSettings
  implements MapViewSettings
{
  getTexturesLayer = ReversteamRivers;

  getMapRules() {
    return (
      <p>
        No changes from base game. No seriously, this is just the base game
        rules on the Reversteam map.
      </p>
    );
  }
}
