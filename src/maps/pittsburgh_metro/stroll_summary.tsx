import { ReactNode } from "react";
import { Button } from "semantic-ui-react";
import {
  GenericMessage,
  SpecialActionSelector,
} from "../../client/game/action_summary";
import { Username } from "../../client/components/username";
import { useAction } from "../../client/services/action";
import { useGrid } from "../../client/utils/injection_context";
import { goodToString } from "../../engine/state/good";
import { SkipStrollAction, StrollAction } from "./stroll";

export function PittsburghMetroSpecialActionSelector() {
  const { canEmit, canEmitUserId, data } = useAction(StrollAction);
  const skip = useAction(SkipStrollAction);
  const grid = useGrid();

  if (canEmitUserId == null) {
    return <SpecialActionSelector />;
  }
  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must stroll a cube.
      </GenericMessage>
    );
  }

  const { from, good } = data ?? {};

  let message: ReactNode;
  if (from == null || good == null) {
    message =
      "Click the cube you want to move to a different city within three hexes.";
  } else {
    message = `Moving a ${goodToString(good)} cube from ${grid.displayName(from)}. Click the destination city, or click a different cube to change your selection.`;
  }

  return (
    <div>
      <p>{message}</p>
      <Button disabled={skip.isPending} onClick={() => skip.emit({})}>
        Skip stroll
      </Button>
    </div>
  );
}
