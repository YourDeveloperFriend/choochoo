import { Button } from "@mui/material";
import { takeWhile } from "lodash";
import { useSearchParams } from "react-router-dom";
import { GameStatus } from "../../api/game";
import { inject } from "../../engine/framework/execution_context";
import { isEliminated, PlayerHelper } from "../../engine/game/player";
import { injectAllPlayersUnsafe, injectPlayersByTurnOrder } from "../../engine/game/state";
import { ProductionAction } from "../../engine/goods_growth/production";
import { SelectAction } from "../../engine/select_action/select";
import { MapRegistry } from "../../maps";
import { deepEquals } from "../../utils/deep_equals";
import { AutoActionForm } from "../auto_action/form";
import { useAwaitingPlayer } from "../components/awaiting_player";
import { Username, UsernameList } from "../components/username";
import { GameMap } from "../grid/game_map";
import { useAction, useGame, useRetryAction, useUndoAction } from "../services/game";
import { GameContextProvider, useCurrentPlayer, useInject } from "../utils/injection_context";
import { ActionSummary } from "./action_summary";
import * as styles from './active_game.module.css';
import { AvailableCities } from "./available_cities";
import { BiddingInfo } from "./bidding_info";
import { Editor } from "./editor";
import { GameLog } from "./game_log";
import { GoodsTable } from "./goods_table";
import { MapInfo } from "./map_info";
import { PlayerStats } from "./player_stats";
import { SpecialActionTable } from "./special_action_table";
import { SwitchToActive, SwitchToUndo } from "./switch";


export function ActiveGame() {
  const game = useGame();
  return <GameContextProvider game={game}>
    <InternalActiveGame />
  </GameContextProvider>;
}

function InternalActiveGame() {
  const { canEmitUserId: canEmitProduction } = useAction(ProductionAction);
  const { canEmitUserId: canEmitSelectAction } = useAction(SelectAction);
  const game = useGame();
  const [searchParams] = useSearchParams();
  const undoOnly = searchParams.get('undoOnly') != null;

  useAwaitingPlayer(game.activePlayerId);

  return <div>
    {!undoOnly && <Header />}
    <GameLog gameId={game.id} />
    <TurnOrder />
    <Editor />
    <UndoButton />
    <SwitchToActive />
    <SwitchToUndo />
    {!undoOnly && <ActionSummary />}
    <AutoActionForm />
    {!undoOnly && canEmitProduction && <GoodsTable />}
    {!undoOnly && <BiddingInfo />}
    {!undoOnly && canEmitSelectAction && <SpecialActionTable />}
    <RetryButton />
    {!undoOnly && <PlayerStats />}
    {!undoOnly && <GameMap />}
    {!undoOnly && !canEmitSelectAction && <SpecialActionTable />}
    {!undoOnly && !canEmitProduction && game.status === GameStatus.enum.ACTIVE && <GoodsTable />}
    {!undoOnly && <AvailableCities />}
    <MapInfo gameKey={game.gameKey} />
  </div>;
}

export function TurnOrder() {
  const turnOrder = useInject(() => injectPlayersByTurnOrder()(), []);
  const current = useCurrentPlayer();

  return <div className={styles.turnOrder}>
    {turnOrder.map((player, index) => <span key={index}>
      {index !== 0 && ' | '}
      <span className={player.color === current?.color ? styles.currentPlayer : ''}>
        <Username userId={player.playerId} />
      </span>
    </span>)}
  </div>;
}

export function Header() {
  const game = useGame();
  return <h1 className={styles.header}>
    [{game.name}] {MapRegistry.singleton.get(game.gameKey).name} - {game.summary}
  </h1>;
}

export function GameOver() {
  const game = useGame();
  const winnerIds = useInject(() => {
    if (game.status !== GameStatus.enum.ENDED) return;
    const helper = inject(PlayerHelper);
    const players = injectAllPlayersUnsafe();
    const scores = players().map((player) => [player.playerId, helper.getScore(player)] as const)
      .sort(([_, score1], [__, score2]) => {
        if (isEliminated(score1)) return 1;
        if (isEliminated(score2)) return -1;
        const p1Score = score1;
        return score2.every((score, index) => score >= p1Score[index]) ? 1 : -1;
      });
    if (isEliminated(scores[0][1])) return [];
    return takeWhile(scores, ([_, score]) => deepEquals(score, scores[0][1])).map(([playerId]) => playerId);
  }, [game]);

  if (winnerIds == null) return <></>;

  return <>
    <p>Game over.</p>
    <p>
      {winnerIds.length === 0 ? 'No one wins.' :
        winnerIds.length === 1 ? <><Username userId={winnerIds[0]} /> wins!</> :
          <>Winners: <UsernameList userIds={winnerIds} /></>
      }
    </p>
  </>;
}

export function UndoButton() {
  const { undo, canUndo, isPending } = useUndoAction();
  if (!canUndo) {
    return <></>;
  }
  return <Button onClick={undo} disabled={isPending}>Undo</Button>;
}

export function RetryButton() {
  const { retry, canRetry, isPending } = useRetryAction();
  if (!canRetry) {
    return <></>;
  }
  return <Button onClick={retry} disabled={isPending}>Retry</Button>;
}