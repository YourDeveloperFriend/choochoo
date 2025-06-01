import { InterceptMoveModalProps } from "../../engine/move/interceptor";
import { useAction } from "../../client/services/action";
import { AlabamaMoveAction } from "./move_good";
import { useCallback, useMemo, useState } from "react";
import { useCurrentPlayer } from "../../client/utils/injection_context";
import { PlayerColor, playerColorToString } from "../../engine/state/player";
import {
  Button,
  DropdownProps,
  Header,
  Modal,
  ModalActions,
  ModalContent,
  Select,
} from "semantic-ui-react";

const NO_ONE = "NO_ONE" as const;
type SelectedPlayer = PlayerColor | typeof NO_ONE;

export function AlabamaRailwaysMoveInterceptorModal({
  cityName,
  moveData,
  clearMoveData: clearMoveDataExternal,
}: InterceptMoveModalProps) {
  const { emit: emitAlabamaMoveAction, isPending: isPending } =
    useAction(AlabamaMoveAction);
  const [selectedPlayer, setSelectedPlayer] = useState<
    SelectedPlayer | undefined
  >(NO_ONE);
  const currentPlayer = useCurrentPlayer();

  const clearMoveData = useCallback(() => {
    clearMoveDataExternal();
    setSelectedPlayer(NO_ONE);
  }, [clearMoveDataExternal, setSelectedPlayer]);

  const options = useMemo(() => {
    if (moveData == null) return [];
    const { path } = moveData;
    const players = new Set(path.map((p) => p.owner));
    return [
      {
        key: NO_ONE,
        text: "",
        value: NO_ONE,
      },
      ...[...players].map((p) => ({
        key: p == null ? "--Unowned--" : p,
        text: p == null ? "Unowned link" : playerColorToString(p),
        value: p,
      })),
    ];
  }, [moveData, currentPlayer?.color]);

  const completeMove = useCallback(() => {
    if (selectedPlayer === NO_ONE) return;
    emitAlabamaMoveAction({
      forgo: selectedPlayer,
      ...moveData!,
    });
    clearMoveData();
    setSelectedPlayer(NO_ONE);
  }, [emitAlabamaMoveAction, clearMoveData, moveData, selectedPlayer]);

  const onChange = useCallback(
    (_: unknown, { value }: DropdownProps) => {
      setSelectedPlayer(value as SelectedPlayer | undefined);
    },
    [setSelectedPlayer],
  );

  return (
    <Modal closeIcon open={moveData != null} onClose={clearMoveData}>
      <Header content={`Deliver to ${cityName}?`} />
      <ModalContent>
        <p>Select a player to miss out on income.</p>
        <Select
          placeholder="Player link"
          options={options}
          onChange={onChange}
        />
      </ModalContent>
      <ModalActions>
        <Button onClick={clearMoveData} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={completeMove} disabled={isPending}>
          Select Player
        </Button>
      </ModalActions>
    </Modal>
  );
}
