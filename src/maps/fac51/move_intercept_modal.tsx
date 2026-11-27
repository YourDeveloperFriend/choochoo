import {
  Button,
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
} from "semantic-ui-react";
import { useAction } from "../../client/services/action";
import {
  useCurrentPlayer,
  useInjectedMemo,
  useInjectedState,
} from "../../client/utils/injection_context";
import { InterceptMoveModalProps } from "../../engine/move/interceptor";
import { MoveAction } from "../../engine/move/move";
import { PlayerColor, playerColorToString } from "../../engine/state/player";
import { Fac51MoveHelper } from "./move";
import { MANIFEST } from "./state";
import { Fac51ManifestReview } from "./manifest_review";

export function Fac51MoveInterceptModal({
  moveData,
  cityName,
  clearMoveData,
}: InterceptMoveModalProps) {
  const { emit, isPending, getErrorMessage } = useAction(MoveAction);
  const player = useCurrentPlayer();
  const manifest = useInjectedState(MANIFEST);
  const helper = useInjectedMemo(Fac51MoveHelper);
  const moveAction = useInjectedMemo(MoveAction);
  const skipped = moveData ? helper.value.skippedCities(moveData) : 0;
  const currentLevel = player ? (manifest.get(player.color) ?? 0) : 0;
  const error = moveData ? getErrorMessage(moveData) : undefined;
  const income = moveData
    ? moveAction.value.calculateIncome(moveData)
    : new Map<PlayerColor | undefined, number>();
  return (
    <Modal open={moveData != null} onClose={clearMoveData} closeIcon>
      <ModalHeader>
        {skipped > 0
          ? "Confirm city skip and Manifest penalty"
          : `Deliver to ${cityName}?`}
      </ModalHeader>
      <ModalContent>
        <Fac51ManifestReview currentLevel={currentLevel} skipped={skipped} />
        {[...income]
          .filter(([owner]) => owner != null)
          .map(([owner, amount]) => (
            <p key={owner}>
              {owner === player?.color
                ? "You gain"
                : `${playerColorToString(owner)} gains`}{" "}
              {amount} income.
            </p>
          ))}
        {error && <p role="alert">{error}</p>}
      </ModalContent>
      <ModalActions>
        <Button onClick={clearMoveData} disabled={isPending}>
          Cancel
        </Button>
        <Button
          positive
          loading={isPending}
          disabled={!moveData || !!error || isPending}
          onClick={() => {
            emit(moveData!);
            clearMoveData();
          }}
        >
          Confirm Delivery
        </Button>
      </ModalActions>
    </Modal>
  );
}
