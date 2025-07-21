import {InterceptMoveModalProps} from "../../engine/move/interceptor";
import {useAction} from "../../client/services/action";
import React, {useCallback} from "react";
import {Memoized, useCurrentPlayer, useGrid, useInjectedMemo,} from "../../client/utils/injection_context";
import {playerColorToString} from "../../engine/state/player";
import {Confirm,} from "semantic-ui-react";
import * as styles from "../../client/components/confirm.module.css";
import {MoveAction, MoveData} from "../../engine/move/move";
import {capitalizeFirstLetter} from "../../utils/functions";
import {getConfirmDeliveryMessage} from "../../client/grid/game_map";
import {ChesapeakeAndOhioMapData} from "./build";

export function ChesapeakeAndOhioMoveInterceptorModal({
  moveData,
  clearMoveData: clearMoveDataExternal,
}: InterceptMoveModalProps) {
  if (!moveData) return null;

  const { emit: emitMoveAction } = useAction(MoveAction);
  const grid = useGrid();
  const player = useCurrentPlayer();
  const moveInstance: Memoized<MoveAction<MoveData>> =
    useInjectedMemo(MoveAction);

  const clearMoveData = useCallback(() => {
    clearMoveDataExternal();
  }, [clearMoveDataExternal]);

  const completeMove = useCallback(() => {
    emitMoveAction(moveData);
    clearMoveData();
  }, [emitMoveAction, clearMoveData, moveData]);

  const message = getConfirmDeliveryMessage(
    player?.color,
    moveData,
    grid,
    moveInstance.value,
  );
  const factoryColor = grid
    .get(moveData.path[moveData.path.length - 1].endingStop)
    ?.getMapSpecific(ChesapeakeAndOhioMapData.parse)?.factoryColor;
  const factoryMessage = factoryColor
    ? `${capitalizeFirstLetter(factoryColor === player?.color ? "you" : playerColorToString(factoryColor))} will receive 1 additional income for delivering to a factory. Then two random cubes will be drawn and added to the destination city.`
    : undefined;
  const content = <>
    <p>{message}</p>
    {factoryMessage ? <p>{factoryMessage}</p> : null}
    </>

  return <Confirm
      open={moveData != null}
      content={{content: content}}
      onCancel={clearMoveData}
      onConfirm={completeMove}
      confirmButton="Confirm Delivery"
      cancelButton="Cancel"
      size="large"
      className={styles.modal}
  />
}
