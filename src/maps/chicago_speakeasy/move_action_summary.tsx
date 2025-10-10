import {
  useCurrentPlayer,
  useInjectedState,
} from "../../client/utils/injection_context";
import { useAction } from "../../client/services/action";
import { BUMP_OFF_ACTION, BumpOffAction, HAS_USED_BUMP_OFF } from "./bump_off";
import { Button, Icon } from "semantic-ui-react";
import { MoveGoods } from "../../client/game/move_goods_action_summary";

export function MoveActionSummary() {
  const { emit, canEmit, data, isPending } = useAction(BumpOffAction);
  const hasUsedBumpOff = useInjectedState(HAS_USED_BUMP_OFF);
  const player = useCurrentPlayer();

  const canUseBumpOff =
    !hasUsedBumpOff && player?.selectedAction === BUMP_OFF_ACTION;

  return (
    <>
      <MoveGoods />
      {canEmit && canUseBumpOff ? (
        <Button
          secondary
          loading={isPending}
          disabled={isPending || !data || !data.coordinates}
          onClick={() => {
            if (data && data.coordinates) {
              emit({
                coordinates: data.coordinates,
              });
            }
          }}
        >
          <Icon name="minus circle" /> Bump Off an Agent
        </Button>
      ) : null}
    </>
  );
}
