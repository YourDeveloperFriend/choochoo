import { DOMINANT_WORKER_BEE } from "./actions";
import {
  Button,
  Modal,
  ModalHeader,
  ModalContent,
  ModalActions,
} from "semantic-ui-react";
import { useAction } from "../../client/services/action";
import {
  useCurrentPlayer,
  useGrid,
  useInjectedMemo,
} from "../../client/utils/injection_context";
import { MoveAction } from "../../engine/move/move";
import { InterceptMoveModalProps } from "../../engine/move/interceptor";
import { PlayerColor, playerColorToString } from "../../engine/state/player";
import { honeybeeCityDisplayName } from "./city_geometry";
import { HoneybeeLogText } from "./log";
import { beeFee } from "./move";

export function HoneybeeMoveInterceptModal({
  moveData,
  cityName,
  clearMoveData,
}: InterceptMoveModalProps) {
  const { emit, isPending, getErrorMessage } = useAction(MoveAction);
  const grid = useGrid();
  const player = useCurrentPlayer();
  const moveAction = useInjectedMemo(MoveAction);
  const waived = player?.selectedAction === DOMINANT_WORKER_BEE;
  const income = moveData
    ? moveAction.value.calculateIncome(moveData)
    : new Map<PlayerColor | undefined, number>();
  const fee = moveData && player ? beeFee(grid, player, moveData) : 0;
  const destination = moveData?.path[moveData.path.length - 1]?.endingStop;
  const destinationName = destination
    ? honeybeeCityDisplayName(grid, destination)
    : cityName;
  const error = moveData ? getErrorMessage(moveData) : undefined;
  return (
    <Modal open={moveData != null} onClose={clearMoveData} closeIcon>
      <ModalHeader>
        Deliver to <HoneybeeLogText text={destinationName ?? ""} grid={grid} />?
      </ModalHeader>
      <ModalContent>
        <HoneybeeDeliveryReview
          fee={fee}
          waived={waived}
          income={income}
          player={player?.color}
        />
        {error && <p role="alert">{error}</p>}
      </ModalContent>
      <ModalActions>
        <Button onClick={clearMoveData} disabled={isPending}>
          Cancel
        </Button>
        <Button
          positive
          disabled={!moveData || !!error || isPending}
          loading={isPending}
          onClick={() => {
            emit(moveData!);
            clearMoveData();
          }}
        >
          {waived ? "Confirm Delivery" : `Deliver for $${fee}`}
        </Button>
      </ModalActions>
    </Modal>
  );
}

/** Shared by board and calculator confirmations; income is the engine's allocation. */
export function HoneybeeDeliveryReview({
  fee,
  waived,
  income,
  player,
}: {
  fee: number;
  waived: boolean;
  income: Map<PlayerColor | undefined, number>;
  player?: PlayerColor;
}) {
  const recipients = [...income].filter(
    ([owner, amount]) => owner != null && amount > 0,
  );
  return (
    <>
      {recipients.length ? (
        recipients.map(([owner, amount]) => (
          <p key={owner}>
            <strong>
              {owner === player ? "You" : playerColorToString(owner)}
            </strong>{" "}
            {owner === player ? "gain" : "gains"} {amount} income.
          </p>
        ))
      ) : (
        <p>This delivery earns no income.</p>
      )}
      {!waived && (
        <p>
          Bee swarm fee: <strong>${fee}</strong>.
        </p>
      )}
    </>
  );
}
