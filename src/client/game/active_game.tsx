import { Button } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { GameStatus } from "../../api/game";
import { inject } from "../../engine/framework/execution_context";
import { PlayerHelper } from "../../engine/game/player";
import { injectPlayersByTurnOrder } from "../../engine/game/state";
import { ProductionAction } from "../../engine/goods_growth/production";
import { SelectAction } from "../../engine/select_action/select";
import { ViewRegistry } from "../../maps/view_registry";
import { AutoActionForm } from "../auto_action/form";
import { useAwaitingPlayer } from "../components/awaiting_player";
import { Username, UsernameList } from "../components/username";
import { GameMap } from "../grid/game_map";
import {
  useAction,
  useGame,
  useRetryAction,
  useUndoAction,
} from "../services/game";
import {
  GameContextProvider,
  useCurrentPlayer,
  useInject,
} from "../utils/injection_context";
import { ActionSummary } from "./action_summary";
import * as styles from "./active_game.module.css";
import { AvailableCities } from "./available_cities";
import { BiddingInfo } from "./bidding_info";
import { Editor } from "./editor";
import { GameLog } from "./game_log";
import { GoodsTable } from "./goods_table";
import { MapInfo } from "./map_info";
import { PlayerStats } from "./player_stats";
import { SpecialActionTable } from "./special_action_table";
import { SwitchToActive, SwitchToUndo } from "./switch";
import { TrackManifest } from "./track_manifest";

export function ActiveGame() {
  const game = useGame();
  return (
    <GameContextProvider game={game}>
      <InternalActiveGame />
    </GameContextProvider>
  );
}

function InternalActiveGame() {
  const { canEmitUserId: canEmitProduction } = useAction(ProductionAction);
  const { canEmitUserId: canEmitSelectAction } = useAction(SelectAction);
  const game = useGame();
  const [searchParams] = useSearchParams();
  const undoOnly = searchParams.get("undoOnly") != null;

  useAwaitingPlayer(game.activePlayerId);

  return (
    <div>
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
      {!undoOnly &&
        !canEmitProduction &&
        game.status === GameStatus.enum.ACTIVE && <GoodsTable />}
      {!undoOnly && !canEmitSelectAction && <SpecialActionTable />}
      {!undoOnly && <AvailableCities />}
      <TrackManifest />
      <MapInfo gameKey={game.gameKey} variant={game.variant} />
    </div>
  );
}

export function TurnOrder() {
  const turnOrder = useInject(() => injectPlayersByTurnOrder()(), []);
  const current = useCurrentPlayer();

  return (
    <div className={styles.turnOrder}>
      {turnOrder.map((player, index) => (
        <span key={index}>
          {index !== 0 && " | "}
          <span
            className={
              player.color === current?.color ? styles.currentPlayer : ""
            }
          >
            <Username userId={player.playerId} />
          </span>
        </span>
      ))}
    </div>
  );
}

export function Header() {
  const game = useGame();
  return (
    <h1 className={styles.header}>
      [{game.name}] {ViewRegistry.singleton.get(game.gameKey).name} -{" "}
      {game.summary}
    </h1>
  );
}

export function GameOver() {
  const game = useGame();
  const winnerIds = useInject(() => {
    if (game.status !== GameStatus.enum.ENDED) return;
    const helper = inject(PlayerHelper);
    return helper.getPlayersOrderedByScore()[0].map(({ playerId }) => playerId);
  }, [game]);

  if (winnerIds == null) return <></>;

  return (
    <>
      <p>Game over.</p>
      <p>
        {winnerIds.length === 0 ? (
          "No one wins."
        ) : winnerIds.length === 1 ? (
          <>
            <Username userId={winnerIds[0]} /> wins!
          </>
        ) : (
          <>
            Winners: <UsernameList userIds={winnerIds} />
          </>
        )}
      </p>
    </>
  );
}

export function UndoButton() {
  const { undo, canUndo, isPending } = useUndoAction();
  if (!canUndo) {
    return <></>;
  }
  return (
    <Button onClick={undo} disabled={isPending}>
      Undo
    </Button>
  );
}

export function RetryButton() {
  const { retry, canRetry, isPending } = useRetryAction();
  if (!canRetry) {
    return <></>;
  }
  return (
    <Button onClick={retry} disabled={isPending}>
      Retry
    </Button>
  );
}
