import { IrelandVariantConfig, VariantConfig } from "../../api/variant_config";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { MapViewSettings } from "../view_settings";
import { DeurbanizeAction } from "./deurbanization";
import { IrelandRivers } from "./rivers";
import { IrelandRules } from "./rules";
import { IRELAND_GAME_KEY, IrelandMapSettings } from "./settings";
import { IrelandVariantEditor } from "./variant_editor";

export class IrelandViewSettings
  extends IrelandMapSettings
  implements MapViewSettings
{
  getInitialVariantConfig(): VariantConfig {
    return { gameKey: IRELAND_GAME_KEY, locoVariant: false };
  }
  getVariantConfigEditor = IrelandVariantEditor;

  getMapRules = IrelandRules;
  getTexturesLayer = IrelandRivers;

  getVariantString(variant: VariantConfig): string[] | undefined {
    if ((variant as IrelandVariantConfig).locoVariant) {
      return ["Loco"];
    }
  }

  useOnMapClick = useDeurbanizeOnClick;
}

function useDeurbanizeOnClick(on: OnClickRegister) {
  const { canEmit, emit, isPending } = useAction(DeurbanizeAction);
  if (canEmit) {
    on(ClickTarget.GOOD, ({ coordinates }, good) =>
      emit({ coordinates, good }),
    );
  }
  return isPending;
}
export const viewSettings = new IrelandViewSettings();
