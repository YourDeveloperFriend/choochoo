import { useSearchParams } from "react-router-dom";
import { GameStatus } from "../../api/game";
import { injectPlayersByTurnOrder } from "../../engine/game/state";
import { ProductionAction } from "../../engine/goods_growth/production";
import { SelectAction } from "../../engine/select_action/select";
import { ViewRegistry } from "../../maps/view_registry";
import { AutoActionForm } from "../auto_action/form";
import { useAwaitingPlayer } from "../components/awaiting_player";
import { Username } from "../components/username";
import { GameMap } from "../grid/game_map";
import { DeleteButton } from "../home/game_card";
import { useAction } from "../services/action";
import { useGame, useRetryAction, useUndoAction } from "../services/game";
import {
  GameContextProvider,
  useCurrentPlayer,
  useInject,
  useViewSettings,
} from "../utils/injection_context";
import { ActionSummary } from "./action_summary";
import * as styles from "./active_game.module.css";
import { AvailableCities } from "./available_cities";
import { BiddingInfo } from "./bidding_info";
import { Editor } from "./editor";
import { GameLog } from "./game_log";
import { GoodsTable } from "./goods_table";
import { HistorySelector } from "./history_selector";
import { IncomeTrack } from "./income_track";
import { MapInfo } from "./map_info";
import { MoveCalculator } from "./move_calculator";
import { GameOptions } from "./options";
import { PlayerStats } from "./player_stats";
import { SpecialActionTable } from "./special_action_table";
import { SwitchToActive, SwitchToUndo } from "./switch";
import { TileManifest } from "./tile_manifest";
import { Button, Icon, Segment } from "semantic-ui-react";

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
  const settings = useViewSettings();
  const game = useGame();
  const [searchParams] = useSearchParams();
  const undoOnly = searchParams.get("undoOnly") != null;

  useAwaitingPlayer(game.activePlayerId);

  return (
    <div>
      {!undoOnly && <GameHeader />}
      <GameLog />
      <HistorySelector />
      <Segment>
        <TurnOrder />
        <Editor />
        <UndoButton />
        <DeleteButton game={game} />
        <SwitchToActive />
        <SwitchToUndo />
        {!undoOnly && <ActionSummary />}
        <AutoActionForm />
      </Segment>
      {!undoOnly && canEmitProduction && <GoodsTable />}
      {!undoOnly && <BiddingInfo />}
      {!undoOnly && canEmitSelectAction && <SpecialActionTable />}
      <RetryButton />
      {!undoOnly && <PlayerStats />}
      <IncomeTrack />
      {settings.additionalSliders?.map((Slider, index) => (
        <Slider key={index} />
      ))}
      <MoveCalculator />
      {!undoOnly && <GameMap />}
      {!undoOnly &&
        !canEmitProduction &&
        game.status === GameStatus.enum.ACTIVE && <GoodsTable />}
      {!undoOnly && !canEmitSelectAction && <SpecialActionTable />}
      {!undoOnly && <AvailableCities />}
      <TileManifest />
      <MapInfo gameKey={game.gameKey} variant={game.variant} />
      <GameOptions />
    </div>
  );
}

function TurnOrder() {
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

function GameHeader() {
  const game = useGame();
  return (
    <h1 className={styles.header}>
      [{game.name}] {ViewRegistry.singleton.get(game.gameKey).name} -{" "}
      {game.summary}
    </h1>
  );
}

function UndoButton() {
  const { undo, canUndo, isPending } = useUndoAction();
  if (!canUndo) {
    return <></>;
  }
  return (
    <Button
      icon
      labelPosition="left"
      basic
      negative
      onClick={undo}
      disabled={isPending}
    >
      <Icon name="undo" />
      Undo
    </Button>
  );
}

function RetryButton() {
  const { retry, canRetry, isPending } = useRetryAction();
  if (!canRetry) {
    return <></>;
  }
  return (
    <Button basic color="teal" onClick={retry} disabled={isPending}>
      Retry
    </Button>
  );
}
