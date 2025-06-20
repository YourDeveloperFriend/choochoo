import { useEmptyAction } from "../services/action";
import { LocoAction } from "../../engine/move/loco";
import { MovePassAction } from "../../engine/move/pass";
import { useViewSettings } from "../utils/injection_context";
import { Username } from "../components/username";
import { MaybeTooltip } from "../components/maybe_tooltip";
import { Button, Icon } from "semantic-ui-react";
import { GenericMessage } from "./action_summary";

export function MoveGoods() {
  const {
    emit: emitLoco,
    canEmit,
    canEmitUserId,
    getErrorMessage,
  } = useEmptyAction(LocoAction);
  const { emit: emitPass } = useEmptyAction(MovePassAction);
  const viewSettings = useViewSettings();

  const message = viewSettings.moveGoodsMessage?.();

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must move a good.
      </GenericMessage>
    );
  }

  const locoDisabledReason = getErrorMessage();

  return (
    <div>
      <GenericMessage>{message ?? "You must move a good."}</GenericMessage>
      <MaybeTooltip tooltip={locoDisabledReason}>
        <Button
          icon
          labelPosition="left"
          color="green"
          onClick={emitLoco}
          disabled={locoDisabledReason != null}
        >
          <Icon name="train" />
          Locomotive
        </Button>
      </MaybeTooltip>
      <Button negative onClick={emitPass}>
        Pass
      </Button>
    </div>
  );
}
