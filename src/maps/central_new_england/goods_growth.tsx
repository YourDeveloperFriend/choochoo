import { useAction } from "../../client/services/action";
import { usePhaseState } from "../../client/utils/injection_context";
import { Phase } from "../../engine/state/phase";
import { GOODS_GROWTH_STATE } from "../../engine/goods_growth/state";
import { Username } from "../../client/components/username";
import { goodToString } from "../../engine/state/good";
import { CentralNewEnglandProductionAction } from "./production";

export function CentralNewEnglandGoodsGrowthSummary() {
  const { canEmit, canEmitUserId } = useAction(
    CentralNewEnglandProductionAction,
  );
  const state = usePhaseState(Phase.GOODS_GROWTH, GOODS_GROWTH_STATE);
  if (canEmitUserId == null) {
    return <></>;
  }

  return (
    <div>
      <p>
        {canEmit ? "You" : <Username userId={canEmitUserId} />} drew{" "}
        {state!.goods.map(goodToString).join(", ")}
      </p>
      {canEmit && (
        <div>
          <p>Select which city to place the drawn cubes.</p>
        </div>
      )}
    </div>
  );
}
