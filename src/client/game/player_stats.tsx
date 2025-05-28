import { useMemo, useState } from "react";
import { GameStatus } from "../../api/game";
import { PlayerHelper } from "../../engine/game/player";
import {
  CURRENT_PLAYER,
  injectAllPlayersUnsafe,
  TURN_ORDER,
} from "../../engine/game/state";
import { ProfitHelper } from "../../engine/income_and_expenses/helper";
import { MoveHelper } from "../../engine/move/helper";
import { getSelectedActionString } from "../../engine/state/action";
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
} from "../utils/injection_context";
import { FinalOverview } from "./final_overview";
import { LoginButton } from "./login_button";

import * as styles from "./player_stats.module.css";
import {
  Accordion,
  AccordionTitle,
  AccordionContent,
  Icon,
  Menu,
  MenuItem,
} from "semantic-ui-react";

export function PlayerStats() {
  const playerData = useInject(() => injectAllPlayersUnsafe()(), []);
  const playerOrder = useInjectedState(TURN_ORDER);
  const currentPlayer = useActiveGameState(CURRENT_PLAYER);
  const [expanded, setExpanded] = useState<boolean>(true);
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
  ];

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
                {players.map((player) => (
                  <tr key={player.playerId} className={styles.tableRow}>
                    <td>
                      <PlayerColorIndicator
                        playerColor={player.color}
                        currentTurn={player.color === currentPlayer}
                      />
                    </td>
                    <td>
                      <Username userId={player.playerId} />
                    </td>
                    <td className={styles.collapsed}>
                      {columns.map((column) => (
                        <div key={column.header} className={styles.inplace}>
                          {column.header}:
                        </div>
                      ))}
                    </td>
                    <td className={styles.collapsed}>
                      {columns.map((column) => {
                        const Cell = column.cell;
                        return (
                          <div key={column.header} className={styles.inplace}>
                            <Cell player={player} />
                          </div>
                        );
                      })}
                    </td>
                    {columns.map((column) => {
                      const Cell = column.cell;
                      return (
                        <td key={column.header} className={styles.expanded}>
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
                ))}
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

const actionColumn = {
  header: "Action",
  cell: ActionCell,
};

function ActionCell({ player }: PlayerStatColumnProps) {
  return <>{getSelectedActionString(player.selectedAction)}</>;
}

const moneyColumn = {
  header: "Money",
  cell: MoneyCell,
};

function MoneyCell({ player }: PlayerStatColumnProps) {
  const profitHelper = useInjected(ProfitHelper);

  return (
    <>
      ${player.money} ({toNet(profitHelper.getProfit(player))})
    </>
  );
}

const incomeColumn = {
  header: "Income",
  cell: IncomeCell,
};

function IncomeCell({ player }: PlayerStatColumnProps) {
  return <>${player.income}</>;
}

const sharesColumn = {
  header: "Shares",
  cell: SharesCell,
};

function SharesCell({ player }: PlayerStatColumnProps) {
  return <>{player.shares}</>;
}

const locoColumn = {
  header: "Loco",
  cell: LocoCell,
};

function LocoCell({ player }: PlayerStatColumnProps) {
  const moveHelper = useInjected(MoveHelper);
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
  return <>{helper.getScore(player)[0]}</>;
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
