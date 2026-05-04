import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { MapViewSettings } from "../view_settings";
import { SelectCityAction } from "./production";
import { IndiaSteamBrothersRivers } from "./rivers";
import { IndiaSteamBrothersRules } from "./rules";
import { IndiaSteamBrothersMapSettings } from "./settings";

export class IndiaSteamBrothersViewSettings
  extends IndiaSteamBrothersMapSettings
  implements MapViewSettings
{
  getMapRules = IndiaSteamBrothersRules;
  getTexturesLayer = IndiaSteamBrothersRivers;

  useOnMapClick = useSelectCityOnClick;
}

function useSelectCityOnClick(on: OnClickRegister) {
  const { canEmit, emit, isPending } = useAction(SelectCityAction);
  if (canEmit) {
    on(ClickTarget.CITY, ({ coordinates }) => emit({ coordinates }));
  }
  return isPending;
}
