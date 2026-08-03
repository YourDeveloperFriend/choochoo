import { useCallback } from "react";
import { Button, Icon } from "semantic-ui-react";
import { PassAction } from "../../engine/goods_growth/pass";
import { ProductionAction } from "../../engine/goods_growth/production";
import { GOODS_GROWTH_STATE } from "../../engine/goods_growth/state";
import { Good, goodToString } from "../../engine/state/good";
import { Phase } from "../../engine/state/phase";
import { assert } from "../../utils/validate";
import { Username } from "../components/username";
import { useAction, useEmptyAction } from "../services/action";
import { useGameVersionState } from "../services/game";
import { usePhaseState } from "../utils/injection_context";
import { GoodsSlot, GoodsTable } from "./goods_table";

/**
 * The base game's production action: place the goods you drew into empty slots of
 * the goods display. Owns the drawn-good selection and drives the goods table
 * with it, so that a map replacing this action can reuse the table on its own
 * terms.
 */
export function ProductionSummary() {
  const { emit, canEmit, canEmitUserId } = useAction(ProductionAction);
  const state = usePhaseState(Phase.GOODS_GROWTH, GOODS_GROWTH_STATE);
  const [manuallySelectedGood, setSelectedGood] = useGameVersionState<
    Good | undefined
  >(undefined);

  const good = manuallySelectedGood ?? state?.goods[0];

  const onClickSlot = useCallback(
    ({ urbanized, cityGroup, onRoll, row }: GoodsSlot) => {
      if (!canEmit) return;
      assert(good != null);
      emit({ urbanized, onRoll, cityGroup, good, row });
    },
    [canEmit, emit, good],
  );

  const toggleSelectedGood = useCallback(() => {
    assert(state != null);
    assert(good != null);
    setSelectedGood(
      state.goods[(state.goods.indexOf(good) + 1) % state.goods.length],
    );
  }, [good, state]);

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
          <p>Select where to place {goodToString(good!)}.</p>
          {state!.goods.length > 1 && (
            <Button
              icon
              labelPosition="left"
              color="teal"
              onClick={toggleSelectedGood}
            >
              <Icon name="arrows alternate horizontal" />
              Switch selected good
            </Button>
          )}
          <PassProduction />
        </div>
      )}
      <GoodsTable
        onClickSlot={onClickSlot}
        // A drawn good can only go into an empty slot.
        isSlotClickable={(_, slotGood) => canEmit && slotGood == null}
      />
    </div>
  );
}

function PassProduction() {
  const { emit } = useEmptyAction(PassAction);
  return (
    <Button negative onClick={emit}>
      Pass
    </Button>
  );
}
