import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { useGrid, useInjected } from "../../client/utils/injection_context";
import { MapViewSettings } from "../view_settings";
import { DiscoMoveHelper } from "./deliver";
import { ProductionAction } from "./production";
import { DiscoInfernoRules } from "./rules";
import { DiscoInfernoMapSettings } from "./settings";

export class DiscoInfernoViewSettings
  extends DiscoInfernoMapSettings
  implements MapViewSettings
{
  getMapRules = DiscoInfernoRules;

  moveGoodsMessage(): string | undefined {
    const helper = useInjected(DiscoMoveHelper);
    const grid = useGrid();

    const lastStop = helper.lastStop();
    if (lastStop == null) return undefined;

    const lastStopName = grid.get(lastStop)!.name();
    const movesRemaining = helper.movesRemaining();

    const tag =
      movesRemaining === 1
        ? "1 move remaining"
        : `${movesRemaining} moves remaining`;
    return `You may continue the chain reaction from ${lastStopName} (${tag})`;
  }

  useOnMapClick = useDiscoProduction;
}

function useDiscoProduction(on: OnClickRegister) {
  const { canEmit, emit, isPending } = useAction(ProductionAction);
  if (canEmit) {
    on(ClickTarget.CITY, (city) => emit({ coordinates: city.coordinates }));
  }
  return isPending;
}
