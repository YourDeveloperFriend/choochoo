import { useInjectedState } from "../../client/utils/injection_context";
import { useEmptyAction } from "../../client/services/action";
import { Button, Icon } from "semantic-ui-react";
import { MoveGoods } from "../../client/game/move_goods_action_summary";
import { DoubleBaseUsaDoubleLocoAction } from "./loco";
import { MaybeTooltip } from "../../client/components/maybe_tooltip";
import { MOVE_STATE } from "../../engine/move/state";

export function DoubleBaseUsaMoveActionSummary() {
  const { emit, canEmit, getErrorMessage } = useEmptyAction(
    DoubleBaseUsaDoubleLocoAction,
  );
  const { moveRound } = useInjectedState(MOVE_STATE);

  const locoDisabledReason = getErrorMessage();

  return (
    <>
      {moveRound !== 2 ? null : (
        <p>If you do not pass, you will spend 3 land grant cubes.</p>
      )}
      <MoveGoods />
      {canEmit ? (
        <div style={{ marginTop: "1em" }}>
          <MaybeTooltip tooltip={locoDisabledReason}>
            <Button
              icon
              labelPosition="left"
              color="olive"
              onClick={emit}
              disabled={locoDisabledReason != null}
            >
              <Icon name="train" />
              <Icon name="train" />
              Double Locomotive
            </Button>
          </MaybeTooltip>
        </div>
      ) : null}
    </>
  );
}
