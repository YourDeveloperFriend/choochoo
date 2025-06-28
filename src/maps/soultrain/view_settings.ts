import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { MapViewSettings } from "../view_settings";
import { PlaceAction } from "./earth_to_heaven";
import { SoulTrainRules } from "./rules";
import { SoulTrainMapSettings } from "./settings";

export class SoulTrainViewSettings
  extends SoulTrainMapSettings
  implements MapViewSettings
{
  getMapRules = SoulTrainRules;
  useOnMapClick = usePlaceOnClick;
}

function usePlaceOnClick(on: OnClickRegister) {
  const { canEmit, isPending, setData } = useAction(PlaceAction);
  if (canEmit) {
    on(ClickTarget.TOWN, (land) => setData({ coordinates: land.coordinates }));
  }
  return isPending;
}
