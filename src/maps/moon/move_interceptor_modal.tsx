import { InterceptMoveModalProps } from "../../engine/move/interceptor";
import { useAction } from "../../client/services/action";
import React, { useCallback, useMemo, useState } from "react";
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
import { MoonMoveAction } from "./low_gravitation";
import * as styles from "../../client/components/confirm.module.css";

const NO_ONE = "NO_ONE" as const;
type SelectedPlayer = PlayerColor | typeof NO_ONE;

export function MoonMoveInterceptorModal({
  cityName,
  moveData,
  clearMoveData: clearMoveDataExternal,
}: InterceptMoveModalProps) {
  const { emit: emitMoonMoveAction, isPending: isPending } =
    useAction(MoonMoveAction);

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
    const players = new Set(
      path.map((p) => p.owner).filter((p) => p != currentPlayer?.color),
    );
    return [
      {
        key: NO_ONE,
        text: "Don't use LG",
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
    emitMoonMoveAction({
      ...moveData!,
      stealFrom:
        selectedPlayer === NO_ONE ? undefined : { color: selectedPlayer },
    });
    clearMoveData();
    setSelectedPlayer(NO_ONE);
  }, [emitMoonMoveAction, clearMoveData, moveData, selectedPlayer]);

  const onChange = useCallback(
    (_: unknown, { value }: DropdownProps) => {
      setSelectedPlayer(value as SelectedPlayer | undefined);
    },
    [setSelectedPlayer],
  );

  return (
    <Modal
      className={styles.modal}
      closeIcon
      open={moveData != null}
      onClose={clearMoveData}
    >
      <Header className={styles.modal} content={`Deliver to ${cityName}?`} />
      <ModalContent>
        <p>
          Optionally, you can use low gravitation to use a player&apos;s link.
        </p>
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
          {selectedPlayer === NO_ONE
            ? "Continue without using low gravitation"
            : "Use low gravitation"}
        </Button>
      </ModalActions>
    </Modal>
  );
}
