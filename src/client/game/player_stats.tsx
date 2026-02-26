import { Fragment, useMemo, useState } from "react";
import { GameStatus } from "../../api/game";
import { PlayerHelper } from "../../engine/game/player";
import {
  CURRENT_PLAYER,
  injectAllPlayersUnsafe,
  TURN_ORDER,
} from "../../engine/game/state";
import { ProfitHelper } from "../../engine/income_and_expenses/helper";
import { MoveHelper } from "../../engine/move/helper";
import { ActionNamingProvider } from "../../engine/state/action";
import { PlayerColor, PlayerData } from "../../engine/state/player";
import { countryName } from "../../maps/cyprus/roles";
import { CyprusMapSettings } from "../../maps/cyprus/settings";
import { Incinerator } from "../../maps/sweden/incinerator";
import { SwedenRecyclingMapSettings } from "../../maps/sweden/settings";
import { getPlayerColorCss } from "../components/player_color";
import { Username } from "../components/username";
import { useGame } from "../services/game";
import {
  useActiveGameState,
  useInject,
  useInjected,
  useInjectedState,
  useViewSettings,
} from "../utils/injection_context";
import { FinalOverview } from "./final_overview";
import { LoginButton } from "./login_button";
import {
  getPlayerWarning,
  PlayerExpandedRow,
  ScoreTooltipContent,
} from "./player_expanded_row";

import * as styles from "./player_stats.module.css";
import {
  Accordion,
  AccordionContent,
  AccordionTitle,
  Icon,
  Menu,
  MenuItem,
  Popup,
} from "semantic-ui-react";

export function PlayerStats() {
  const playerData = useInject(() => injectAllPlayersUnsafe()(), []);
  const playerOrder = useInjectedState(TURN_ORDER);
  const currentPlayer = useActiveGameState(CURRENT_PLAYER);
  const [expanded, setExpanded] = useState<boolean>(true);
  const [expandedPlayer, setExpandedPlayer] = useState<PlayerColor | null>(
    null,
  );
  const viewSettings = useViewSettings();
  const outOfGamePlayers = playerData
    .filter((p) => p.outOfGame)
    .map((p) => p.color);
  const players = useMemo<PlayerData[]>(
    () =>
      playerOrder.concat(outOfGamePlayers).map((color) => {
        return playerData.find((player) => player.color === color)!;
      }),
    [playerOrder, playerData],
  );
  const game = useGame();
  const gameKey = game.gameKey;

  if (game.status === GameStatus.enum.ENDED) return <FinalOverview />;

  const columns = [
    ...(gameKey === CyprusMapSettings.key ? [cyprusRoleColumn] : []),
    actionColumn,
    moneyColumn,
    incomeColumn,
    sharesColumn,
    locoColumn,
    ...(gameKey === SwedenRecyclingMapSettings.key ? [garbageColumn] : []),
    scoreColumn,
    ...(viewSettings.getPlayerStatColumns
      ? viewSettings.getPlayerStatColumns()
      : []),
  ];

  // Total columns: chevron + color indicator + player name + collapsed cols (2) + expanded cols (columns.length) + login button
  const totalColSpan = columns.length + 6;

  function toggleExpandedPlayer(color: PlayerColor) {
    setExpandedPlayer((prev) => (prev === color ? null : color));
  }

  return (
    <Accordion fluid as={Menu} vertical>
      <MenuItem>
        <AccordionTitle
          active={expanded}
          index={0}
          onClick={() => setExpanded(!expanded)}
          content="Player overview"
        />
        <AccordionContent active={expanded}>
          <div className={styles.playerStats}>
            <table>
              <thead>
                <tr className={styles.tableRow}>
                  <th></th>
                  <th></th>
                  <th>Player</th>
                  <th className={styles.collapsed}>Stats</th>
                  <th className={styles.collapsed}></th>
                  {columns.map((column) => (
                    <th key={column.header} className={styles.expanded}>
                      {column.header}
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => {
                  const isCurrentPlayer = player.color === currentPlayer;
                  const isExpanded = expandedPlayer === player.color;
                  const rowClasses = [
                    styles.tableRow,
                    player.outOfGame ? styles.eliminatedRow : "",
                    isCurrentPlayer ? styles.currentPlayerRow : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <Fragment key={player.playerId}>
                      <tr className={rowClasses}>
                        <td>
                          <button
                            className={styles.chevronBtn}
                            onClick={() => toggleExpandedPlayer(player.color)}
                            aria-expanded={isExpanded}
                            aria-label="Expand player details"
                          >
                            <Icon
                              name={
                                isExpanded ? "chevron down" : "chevron right"
                              }
                              size="small"
                              fitted
                            />
                          </button>
                        </td>
                        <td>
                          <PlayerColorIndicator
                            playerColor={player.color}
                            currentTurn={isCurrentPlayer}
                          />
                        </td>
                        <td>
                          <PlayerNameCell player={player} />
                        </td>
                        <td className={styles.collapsed}>
                          {columns.map((column) => (
                            <div
                              key={column.header}
                              className={styles.inplace}
                            >
                              {column.header}:
                            </div>
                          ))}
                        </td>
                        <td className={styles.collapsed}>
                          {columns.map((column) => {
                            const Cell = column.cell;
                            return (
                              <div
                                key={column.header}
                                className={styles.inplace}
                              >
                                <Cell player={player} />
                              </div>
                            );
                          })}
                        </td>
                        {columns.map((column) => {
                          const Cell = column.cell;
                          return (
                            <td
                              key={column.header}
                              className={styles.expanded}
                            >
                              <Cell player={player} />
                            </td>
                          );
                        })}
                        <td>
                          <LoginButton playerId={player.playerId}>
                            Switch
                          </LoginButton>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr
                          key={`${player.playerId}-expanded`}
                          className={
                            isCurrentPlayer
                              ? styles.expandedRowCurrent
                              : styles.expandedRow
                          }
                        >
                          {/* Desktop expanded row cell: spans all desktop-visible columns */}
                          <td
                            colSpan={totalColSpan}
                            className={`${styles.expandedRowCell} ${styles.expanded}`}
                          >
                            <PlayerExpandedRow
                              player={player}
                              isCurrentPlayer={isCurrentPlayer}
                            />
                          </td>
                          {/* Mobile expanded row cell: spans all mobile-visible columns (6) */}
                          <td
                            colSpan={6}
                            className={`${styles.expandedRowCell} ${styles.collapsed}`}
                          >
                            <PlayerExpandedRow
                              player={player}
                              isCurrentPlayer={isCurrentPlayer}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}

interface PlayerStatColumnProps {
  player: PlayerData;
}

function PlayerNameCell({ player }: PlayerStatColumnProps) {
  const warning = getPlayerWarning(player);

  return (
    <div className={styles.playerCell}>
      <span className={player.outOfGame ? styles.playerNameEliminated : ""}>
        <Username userId={player.playerId} />
      </span>
      {player.outOfGame && (
        <span className={styles.badgeEliminated}>Eliminated</span>
      )}
      {!player.outOfGame && warning.hasEliminationRisk && (
        <Popup
          content="At risk of elimination — expenses exceed cash and would reduce income below $0"
          trigger={
            <Icon name="warning sign" size="small" className={styles.warningRed} />
          }
          position="bottom center"
          size="small"
        />
      )}
      {!player.outOfGame && warning.hasIncomeLoss && (
        <Popup
          content="Cannot fully pay expenses — will lose income"
          trigger={
            <Icon name="warning sign" size="small" className={styles.warningAmber} />
          }
          position="bottom center"
          size="small"
        />
      )}
    </div>
  );
}

const actionColumn = {
  header: "Action",
  cell: ActionCell,
};

function ActionCell({ player }: PlayerStatColumnProps) {
  const actionNamingProvider = useInjected(ActionNamingProvider);
  if (player.outOfGame) return <span className={styles.textMuted}>—</span>;
  return <>{actionNamingProvider.getActionString(player.selectedAction)}</>;
}

const moneyColumn = {
  header: "Money",
  cell: MoneyCell,
};

function MoneyCell({ player }: PlayerStatColumnProps) {
  const profitHelper = useInjected(ProfitHelper);
  if (player.outOfGame) return <span className={styles.textMuted}>—</span>;
  const profit = profitHelper.getProfit(player);

  return (
    <div className={styles.moneyDisplay}>
      <span className={styles.moneyValue}>${player.money}</span>
      <span
        className={
          profit >= 0 ? styles.moneyNetPositive : styles.moneyNetNegative
        }
      >
        ({toNet(profit)})
      </span>
    </div>
  );
}

const incomeColumn = {
  header: "Income",
  cell: IncomeCell,
};

function IncomeCell({ player }: PlayerStatColumnProps) {
  if (player.outOfGame) return <span className={styles.textMuted}>—</span>;
  return <>${player.income}</>;
}

const sharesColumn = {
  header: "Shares",
  cell: SharesCell,
};

function SharesCell({ player }: PlayerStatColumnProps) {
  if (player.outOfGame) return <span className={styles.textMuted}>—</span>;
  return <>{player.shares}</>;
}

const locoColumn = {
  header: "Loco",
  cell: LocoCell,
};

function LocoCell({ player }: PlayerStatColumnProps) {
  const moveHelper = useInjected(MoveHelper);
  if (player.outOfGame) return <span className={styles.textMuted}>—</span>;
  return <>{moveHelper.getLocomotiveDisplay(player)}</>;
}

const garbageColumn = {
  header: "Garbage",
  cell: GarbageCell,
};

function GarbageCell({ player }: PlayerStatColumnProps) {
  const incinerator = useInjected(Incinerator);
  return <>{incinerator.getGarbageCountForUser(player.color)}</>;
}

const scoreColumn = {
  header: "Score",
  cell: ScoreCell,
};

function ScoreCell({ player }: PlayerStatColumnProps) {
  const helper = useInjected(PlayerHelper);
  if (player.outOfGame) {
    return <span>E</span>;
  }
  return (
    <div className={styles.scoreCell}>
      <span>{helper.getScore(player)[0]}</span>
      <Popup
        content={<ScoreTooltipContent player={player} />}
        trigger={<Icon name="info circle" size="small" className={styles.infoIcon} />}
        position="left center"
        size="small"
        className="score-tooltip"
      />
    </div>
  );
}

const cyprusRoleColumn = {
  header: "Role",
  cell: RoleCell,
};

function RoleCell({ player }: PlayerStatColumnProps) {
  return <>{countryName(player.color)}</>;
}

interface PlayerColorIndicatorProps {
  playerColor?: PlayerColor;
  currentTurn: boolean;
}

export function PlayerColorIndicator({
  playerColor,
  currentTurn,
}: PlayerColorIndicatorProps) {
  const className = `${styles.user} ${getPlayerColorCss(playerColor)}`;
  return currentTurn ? (
    <Icon name="arrow circle right" size="large" className={className} />
  ) : (
    <Icon name="circle" size="large" className={className} />
  );
}

function toNet(number: number): string {
  return number >= 0 ? `+$${number}` : `-$${-number}`;
}
