import { useCallback, useMemo, useState } from "react";
import {
  Button,
  DropdownProps,
  Header,
  Modal,
  ModalActions,
  ModalContent,
  Select,
} from "semantic-ui-react";
import { GameKey } from "../../api/game_key";
import { MoveData } from "../../engine/move/move";
import { PlayerColor, playerColorToString } from "../../engine/state/player";
import {
  AlabamaMoveAction,
  AlabamaMoveData,
} from "../../maps/alabama_railways/move_good";
import { MoonMoveAction } from "../../maps/moon/low_gravitation";
import * as styles from "../components/confirm.module.css";
import { useAction } from "../services/action";
import {
  useCurrentPlayer,
  useGameKey,
  useInjectedMemo,
} from "../utils/injection_context";

interface InterceptMoveModalProps {
  cityName?: string;
  moveData?: MoveData;
  clearMoveData(): void;
}

export function useMoveInterceptionState() {
  const gameKey = useGameKey();
  const moonMoveAction = useInjectedMemo(MoonMoveAction);
  const { canEmit: canEmitMoonMove } = useAction(MoonMoveAction);
  const currentPlayer = useCurrentPlayer()?.color;
  const [[cityName, moveData], setInternalState] = useState<
    [string, MoveData] | [undefined, undefined]
  >([undefined, undefined]);
  const clearMoveData = useCallback(() => {
    setInternalState([undefined, undefined]);
  }, []);
  const maybeInterceptMove = useCallback(
    (moveData: MoveData, cityName: string) => {
      const hasAChoice =
        currentPlayer != null &&
        moveData.path.some(({ owner }) => owner !== currentPlayer);
      if (gameKey === GameKey.ALABAMA_RAILWAYS) {
        if (!hasAChoice) {
          (moveData as AlabamaMoveData).forgo = moveData.path[0].owner;
          return false;
        }
        setInternalState([cityName, moveData]);
        return true;
      }
      if (
        gameKey === GameKey.MOON &&
        hasAChoice &&
        moonMoveAction.value.hasLowGravitation()
      ) {
        setInternalState([cityName, moveData]);
        return true;
      }
      return false;
    },
    [canEmitMoonMove, moonMoveAction, gameKey, setInternalState, currentPlayer],
  );
  return {
    moveData,
    cityName,
    clearMoveData,
    maybeInterceptMove,
  };
}

const NO_ONE = "NO_ONE" as const;

type SelectedPlayer = PlayerColor | typeof NO_ONE;

export function InterceptMoveModal({
  cityName,
  moveData,
  clearMoveData: clearMoveDataExternal,
}: InterceptMoveModalProps) {
  const gameKey = useGameKey();
  const { emit: emitMoonMoveAction, isPending: isMoonPending } =
    useAction(MoonMoveAction);
  const { emit: emitAlabamaMoveAction, isPending: isAlabamaPending } =
    useAction(AlabamaMoveAction);
  const isPending = isMoonPending || isAlabamaPending;

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
      path
        .map((p) => p.owner)
        .filter((p) =>
          gameKey === GameKey.MOON ? p != currentPlayer?.color : true,
        ),
    );
    return [
      {
        key: NO_ONE,
        text: gameKey === GameKey.MOON ? "Don't use LG" : "",
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
    if (gameKey === GameKey.MOON) {
      emitMoonMoveAction({
        ...moveData!,
        stealFrom:
          selectedPlayer === NO_ONE ? undefined : { color: selectedPlayer },
      });
    } else {
      if (selectedPlayer === NO_ONE) return;
      emitAlabamaMoveAction({
        forgo: selectedPlayer,
        ...moveData!,
      });
    }
    clearMoveData();
    setSelectedPlayer(NO_ONE);
  }, [
    gameKey,
    emitMoonMoveAction,
    emitAlabamaMoveAction,
    clearMoveData,
    moveData,
    selectedPlayer,
  ]);

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
        {gameKey === GameKey.MOON && (
          <p>
            Optionally, you can use low gravitation to use a player&apos;s link.
          </p>
        )}
        {gameKey === GameKey.ALABAMA_RAILWAYS && (
          <p>Select a player to miss out on income.</p>
        )}
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
          {gameKey === GameKey.ALABAMA_RAILWAYS
            ? "Select Player"
            : selectedPlayer === NO_ONE
              ? "Continue without using low gravitation"
              : "Use low gravitation"}
        </Button>
      </ModalActions>
    </Modal>
  );
}
