import { MapViewSettings } from "../view_settings";
import { BelgiumRules } from "./rules";
import { BelgiumMapSettings } from "./settings";
import { useAction } from "../../client/services/action";
import { BuildAction } from "../../engine/build/build";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";

export class BelgiumViewSettings
  extends BelgiumMapSettings
  implements MapViewSettings
{
  getMapRules = BelgiumRules;
  useOnMapClick = useBuildOnClick;
}

function useBuildOnClick(on: OnClickRegister) {
  const { canEmit, isPending, setData } = useAction(BuildAction);

  if (canEmit) {
    on(ClickTarget.CITY, (city) => setData({ coordinates: city.coordinates }));
  }
  return isPending;
}
