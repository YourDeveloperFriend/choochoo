import { ReactNode } from "react";
import { Button } from "semantic-ui-react";
import { MovePassAction } from "../../engine/move/pass";
import { Phase } from "../../engine/state/phase";
import { Username } from "../../client/components/username";
import { useEmptyAction } from "../../client/services/action";
import { GenericMessage } from "../../client/game/action_summary";
import { MapViewSettings } from "../view_settings";
import { FourLocoMapSettings } from "./settings";

function FourLocoMoveGoods() {
  const {
    emit: emitPass,
    canEmit,
    canEmitUserId,
  } = useEmptyAction(MovePassAction);

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must move a good or pass.
      </GenericMessage>
    );
  }

  return (
    <div>
      <GenericMessage>You must move a good or pass.</GenericMessage>
      <Button negative onClick={emitPass}>
        Pass
      </Button>
    </div>
  );
}

export class FourLocoViewSettings
  extends FourLocoMapSettings
  implements MapViewSettings
{
  getMapRules() {
    return (
      <ul>
        <li>All players start at engine level 4. No Locomotive action.</li>
        <li>Each delivery must use exactly 4 links.</li>
        <li>Players may only use their own track.</li>
        <li>Delivery phase repeats until all players pass consecutively.</li>
        <li>Every delivery awards exactly 2 income.</li>
        <li>Engine level is excluded from expenses.</li>
        <li>Shares cost $3 each.</li>
        <li>Turns: 2p→10, 3p→8, 4p→7, 5p→6, 6p→5.</li>
      </ul>
    );
  }

  getActionSummary(phase: Phase | undefined): (() => ReactNode) | undefined {
    if (phase === Phase.MOVING) {
      return FourLocoMoveGoods;
    }
    return undefined;
  }
}
export const viewSettings = new FourLocoViewSettings();
