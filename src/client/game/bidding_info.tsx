import { ReactNode, useMemo } from "react";
import { CURRENT_PLAYER, TURN_ORDER } from "../../engine/game/state";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { TURN_ORDER_STATE } from "../../engine/turn_order/state";
import { duplicate } from "../../utils/functions";
import { getPlayerColorCss } from "../components/player_color";
import {
  useActiveGameState,
  useInjectedState,
  usePhaseState,
} from "../utils/injection_context";
import * as styles from "./bidding_info.module.css";

export function BiddingInfo() {
  const playerOrder = useInjectedState(TURN_ORDER);
  const currentPlayer = useActiveGameState(CURRENT_PLAYER);
  const turnOrderState = usePhaseState(Phase.TURN_ORDER, TURN_ORDER_STATE);

  const biddingPlayers = useMemo(
    () =>
      playerOrder.map((color) =>
        turnOrderState != null && !turnOrderState.nextTurnOrder.includes(color)
          ? {
              color,
              bid: turnOrderState?.previousBids[color],
              underlined: color === currentPlayer,
            }
          : {},
      ),
    [currentPlayer, turnOrderState],
  );
  const passedPlayers = useMemo(
    () =>
      duplicate<PlayerColor | undefined>(
        playerOrder.length - (turnOrderState?.nextTurnOrder.length ?? 0),
        undefined,
      )
        .concat(turnOrderState?.nextTurnOrder ?? [])
        .map((color, index) => ({
          color,
          caption: getCaption(index + 1, playerOrder.length),
        })),
    [biddingPlayers],
  );

  if (turnOrderState == null) {
    return <></>;
  }

  return (
    <div className={styles.colorListContainer}>
      <div className={styles.colorList}>
        {biddingPlayers.map((props, index) => (
          <PlayerCircle key={index} {...props} />
        ))}
      </div>
      <div className={styles.colorList}>
        {passedPlayers.map((props, index) => (
          <PlayerCircle key={index} {...props} />
        ))}
      </div>
    </div>
  );
}

function getCaption(turnOrder: number, totalPlayers: number): string {
  if (totalPlayers === turnOrder) {
    return "Free";
  }
  if (turnOrder === 1 || turnOrder === 2) {
    return "100%";
  }
  return "50%";
}

interface PlayerCircleProps {
  color?: PlayerColor;
  underlined?: boolean;
  bid?: number;
  caption?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
}

export function PlayerCircle({
  color,
  bid,
  underlined,
  caption,
  disabled,
  children,
}: PlayerCircleProps) {
  const content = children ?? (bid != null ? `$${bid}` : disabled ? "X" : "");
  return (
    <div
      className={`${styles.playerCircleContainer} ${underlined ? styles.underlined : ""}`}
    >
      <div
        className={`${styles.playerCircle}  ${getPlayerColorCss(color)}  ${disabled ? styles.disabled : ""}`}
      >
        {content}
      </div>
      <div className={styles.captionContainer}>{caption}</div>
    </div>
  );
}
