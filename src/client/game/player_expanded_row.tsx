import { PlayerHelper } from "../../engine/game/player";
import { PHASE } from "../../engine/game/phase";
import { ProfitHelper } from "../../engine/income_and_expenses/helper";
import { Phase } from "../../engine/state/phase";
import { PlayerData } from "../../engine/state/player";
import { TURN_ORDER_STATE } from "../../engine/turn_order/state";
import { getPlayerColorCss } from "../components/player_color";
import {
  useInjected,
  useInjectedState,
  usePhaseState,
} from "../utils/injection_context";
import { Icon } from "semantic-ui-react";

import * as styles from "./player_expanded_row.module.css";

const TRACK_ZONE_COLORS = [
  "#d4c2a8",
  "#9a8d85",
  "#929164",
  "#6f7e7b",
  "#ba6e3b",
  "#a71b27",
];

const TRACK_ZONE_LABELS = ["-$0", "-$2", "-$4", "-$6", "-$8", "-$10"];

function calculateIncomeReduction(income: number): number {
  if (income <= 10) return 0;
  if (income >= 51) return 10;
  return Math.floor((income - 1) / 10) * 2;
}

interface PlayerWarning {
  hasIncomeLoss: boolean;
  hasEliminationRisk: boolean;
  deficit: number;
  newIncome: number;
}

export function getPlayerWarning(player: PlayerData): PlayerWarning {
  const expenses = player.shares + player.locomotive;
  const profit = player.income - expenses;
  const endOfTurnMoney = player.money + profit;

  if (endOfTurnMoney >= 0 || player.outOfGame) {
    return {
      hasIncomeLoss: false,
      hasEliminationRisk: false,
      deficit: 0,
      newIncome: player.income - calculateIncomeReduction(player.income),
    };
  }

  const deficit = Math.abs(endOfTurnMoney);
  const incomeAfterPayment = player.income - deficit;

  return {
    hasIncomeLoss: incomeAfterPayment >= 0,
    hasEliminationRisk: incomeAfterPayment < 0,
    deficit,
    newIncome: incomeAfterPayment,
  };
}

function formatMoney(amount: number): string {
  return amount >= 0 ? `$${amount}` : `-$${Math.abs(amount)}`;
}

function formatNet(amount: number): string {
  return amount >= 0 ? `+$${amount}` : `-$${Math.abs(amount)}`;
}

interface PlayerExpandedRowProps {
  player: PlayerData;
  isCurrentPlayer: boolean;
}

export function PlayerExpandedRow({
  player,
}: PlayerExpandedRowProps) {
  if (player.outOfGame) {
    return <EliminatedExpandedView />;
  }

  return (
    <div className={styles.expandedContent}>
      <WarningBanners player={player} />
      <div className={styles.twoColumnGrid}>
        <div>
          <FinancialDetailsPanel player={player} />
          <IncomeTrackVisualization player={player} />
          {player.locomotive < 6 && (
            <LocoUpgradeImpactPanel player={player} />
          )}
        </div>
        <div>
          <ScoreBreakdownPanel player={player} />
        </div>
      </div>
      <BiddingImpactSection player={player} />
    </div>
  );
}

function WarningBanners({ player }: { player: PlayerData }) {
  const warning = getPlayerWarning(player);
  const expenses = player.shares + player.locomotive;

  if (warning.hasEliminationRisk) {
    return (
      <div
        className={`${styles.warningBanner} ${styles.warningBannerRed}`}
      >
        <div className={styles.warningBannerContent}>
          <Icon
            name="warning sign"
            className={styles.warningBannerIcon}
            style={{ color: "#dc2626" }}
          />
          <div className={styles.warningBannerText}>
            <div className={styles.warningTitleRed}>
              ⚠️ Elimination Risk
            </div>
            <div className={styles.warningBodyRed}>
              Cannot fully pay {formatMoney(expenses)} in expenses with{" "}
              {formatMoney(player.money)} cash. Income would drop below $0.
              <div style={{ marginTop: 4 }}>
                Income will be: {formatMoney(player.income)} →{" "}
                <span style={{ fontWeight: 600 }}>
                  {formatMoney(warning.newIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (warning.hasIncomeLoss) {
    return (
      <div
        className={`${styles.warningBanner} ${styles.warningBannerAmber}`}
      >
        <div className={styles.warningBannerContent}>
          <Icon
            name="warning sign"
            className={styles.warningBannerIcon}
            style={{ color: "#f59e0b" }}
          />
          <div className={styles.warningBannerText}>
            <div className={styles.warningTitleAmber}>
              ⚠️ Income Loss Warning
            </div>
            <div className={styles.warningBodyAmber}>
              Cannot fully pay {formatMoney(expenses)} in expenses with{" "}
              {formatMoney(player.money)} cash. Will pay all cash and reduce
              income by {formatMoney(warning.deficit)}.
              <div style={{ marginTop: 4 }}>
                New income will be: {formatMoney(player.income)} →{" "}
                <span style={{ fontWeight: 600 }}>
                  {formatMoney(warning.newIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function FinancialDetailsPanel({ player }: { player: PlayerData }) {
  const profitHelper = useInjected(ProfitHelper);
  const income = profitHelper.getIncome(player);
  const expenses = profitHelper.getExpenses(player);
  const profit = profitHelper.getProfit(player);
  const endOfTurnMoney = player.money + profit;
  const warning = getPlayerWarning(player);

  const netIncomeHighlight = warning.hasIncomeLoss || warning.hasEliminationRisk;

  return (
    <div className={styles.panelSection}>
      <div className={styles.panelTitle}>Financial Details</div>
      <div className={styles.panelCard}>
        <div className={styles.panelRow}>
          <span className={styles.panelLabel}>Current Money:</span>
          <span className={styles.panelValue}>{formatMoney(player.money)}</span>
        </div>
        <div className={styles.panelRow}>
          <span className={styles.panelLabel}>Income:</span>
          <span className={`${styles.panelValue} ${styles.valuePositive}`}>
            +{formatMoney(income)}
          </span>
        </div>
        <div className={styles.panelRow}>
          <span className={styles.panelLabel}>Expenses:</span>
          <span className={`${styles.panelValue} ${styles.valueNegative}`}>
            -{formatMoney(expenses)}
          </span>
        </div>
        <div className={styles.panelSubrow}>
          <span>• Locomotive maintenance:</span>
          <span>-{formatMoney(player.locomotive)}</span>
        </div>
        <div className={styles.panelSubrow}>
          <span>• Share interest:</span>
          <span>-{formatMoney(player.shares)}</span>
        </div>
        <div
          className={`${styles.panelRow} ${styles.panelDivider} ${netIncomeHighlight ? styles.panelHighlight : ""}`}
        >
          <span className={styles.panelLabel}>Net Income:</span>
          <span
            className={`${styles.panelValue} ${profit >= 0 ? styles.valuePositive : styles.valueNegative}`}
          >
            {formatNet(profit)}
          </span>
        </div>
        <div className={`${styles.panelRow} ${styles.panelDivider}`}>
          <span className={`${styles.panelLabel} ${styles.panelBold}`}>
            End-of-Turn Money:
          </span>
          <span className={`${styles.panelValue} ${styles.panelBold}`}>
            {endOfTurnMoney >= 0
              ? formatMoney(endOfTurnMoney)
              : `${formatMoney(endOfTurnMoney)} (needs ${formatMoney(Math.abs(endOfTurnMoney))})`}
          </span>
        </div>
      </div>
    </div>
  );
}

function IncomeTrackVisualization({ player }: { player: PlayerData }) {
  const income = player.income;
  // Position pip: 0-60 scale mapped to 0-100%
  const pipPosition = Math.min(Math.max((income / 60) * 100, 2), 97);

  return (
    <div className={styles.panelSection}>
      <div className={styles.panelCard}>
        <div className={styles.trackLabel}>Income Track - End of Round</div>
        <div className={styles.trackLabels}>
          {TRACK_ZONE_LABELS.map((label, i) => (
            <div
              key={i}
              className={`${styles.trackLabelItem} ${i === 5 ? styles.trackLabelDanger : ""}`}
            >
              {label}
            </div>
          ))}
        </div>
        <div className={styles.trackVisual}>
          {TRACK_ZONE_COLORS.map((color, i) => (
            <div
              key={i}
              className={styles.trackZone}
              style={{ backgroundColor: color }}
            />
          ))}
          <div
            className={`${styles.trackPip} ${getPlayerColorCss(player.color)}`}
            style={{ left: `${pipPosition}%` }}
          />
        </div>
        <div className={styles.trackCurrentValue}>
          Current income: <span>{formatMoney(income)}</span>
        </div>
      </div>
    </div>
  );
}

function LocoUpgradeImpactPanel({ player }: { player: PlayerData }) {
  const profitHelper = useInjected(ProfitHelper);
  const currentProfit = profitHelper.getProfit(player);
  const currentMaintenance = player.locomotive;
  const afterUpgradeMaintenance = player.locomotive + 1;
  const profitAfterUpgrade = currentProfit - 1; // one more loco expense

  return (
    <div className={styles.panelSection}>
      <div className={styles.panelCard}>
        <div className={styles.trackLabel}>Locomotive Upgrade Impact</div>
        <div className={styles.panelRow}>
          <span className={styles.panelLabel}>Current links:</span>
          <span className={styles.panelValue}>{player.locomotive}</span>
        </div>
        <div className={styles.panelRow}>
          <span className={styles.panelLabel}>Current maintenance:</span>
          <span className={`${styles.panelValue} ${styles.valueNegative}`}>
            -{formatMoney(currentMaintenance)}/round
          </span>
        </div>
        <div className={`${styles.panelRow} ${styles.panelDivider}`}>
          <span className={styles.panelLabel}>
            After upgrade to {player.locomotive + 1} links:
          </span>
          <span className={`${styles.panelValue} ${styles.valueNegative}`}>
            -{formatMoney(afterUpgradeMaintenance)}/round
          </span>
        </div>
        <div className={`${styles.panelRow} ${styles.panelDivider}`}>
          <span className={styles.panelLabel}>Current net income:</span>
          <span
            className={`${styles.panelValue} ${currentProfit >= 0 ? styles.valuePositive : styles.valueNegative}`}
          >
            {formatNet(currentProfit)}
          </span>
        </div>
        <div className={styles.panelRow}>
          <span className={styles.panelLabel}>Net income after upgrade:</span>
          <span
            className={`${styles.panelValue} ${profitAfterUpgrade >= 0 ? styles.valuePositive : styles.valueNegative}`}
          >
            {formatNet(profitAfterUpgrade)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ScoreBreakdownPanel({ player }: { player: PlayerData }) {
  const playerHelper = useInjected(PlayerHelper);
  const incomePoints = playerHelper.getScoreFromIncome(player);
  const sharePoints = playerHelper.getScoreFromShares(player);
  const trackPoints = playerHelper.getScoreFromTrack(player);
  const trackCount = playerHelper.countTrack(player.color);
  const totalScore = playerHelper.getScore(player)[0];

  return (
    <div className={styles.panelSection}>
      <div className={styles.panelTitle}>Score Breakdown</div>
      <div className={styles.panelCard}>
        <div className={styles.panelRow}>
          <span className={styles.panelLabel}>
            Income points ({player.income} × 3):
          </span>
          <span className={`${styles.panelValue} ${styles.valuePositive}`}>
            +{incomePoints}
          </span>
        </div>
        <div className={styles.panelRow}>
          <span className={styles.panelLabel}>
            Share penalty ({player.shares} × -3):
          </span>
          <span className={`${styles.panelValue} ${styles.valueNegative}`}>
            {sharePoints}
          </span>
        </div>
        <div className={styles.panelRow}>
          <span className={styles.panelLabel}>
            Track points ({trackCount} sections × 1):
          </span>
          <span className={`${styles.panelValue} ${styles.valuePositive}`}>
            +{trackPoints}
          </span>
        </div>
        <div className={`${styles.panelRow} ${styles.panelDivider}`}>
          <span className={`${styles.panelLabel} ${styles.panelBold}`}>
            Total Score:
          </span>
          <span className={`${styles.panelValue} ${styles.panelBold}`}>
            {totalScore}
          </span>
        </div>
      </div>
    </div>
  );
}

function BiddingImpactSection({ player }: { player: PlayerData }) {
  const phase = useInjectedState(PHASE);
  const isAuctionPhase =
    phase === Phase.TURN_ORDER || phase === Phase.ST_LUCIA_TURN_ORDER;
  
  const turnOrderState = usePhaseState(
    isAuctionPhase ? phase : Phase.TURN_ORDER,
    TURN_ORDER_STATE
  );
  const profitHelper = useInjected(ProfitHelper);

  if (!isAuctionPhase || turnOrderState == null) return null;

  const bid = turnOrderState.previousBids[player.color];
  if (bid == null || bid === 0) return null;

  const profit = profitHelper.getProfit(player);
  const endOfTurnMoney = player.money + profit;
  const worstCase = endOfTurnMoney - bid;
  const likelyCase = endOfTurnMoney - Math.ceil(bid / 2);
  const bestCase = endOfTurnMoney;

  return (
    <div className={styles.biddingSection}>
      <div className={styles.panelTitle}>
        Bidding Impact on End-of-Turn Money (Current Bid: {formatMoney(bid)})
      </div>
      <div className={styles.panelCard}>
        <div className={styles.biddingHeader}>
          End-of-turn money without bid:{" "}
          <span style={{ fontWeight: 500 }}>{formatMoney(endOfTurnMoney)}</span>
        </div>
        <div className={styles.biddingGrid}>
          <BiddingScenario
            label="Worst Case"
            value={worstCase}
            description={`Full cost (-${formatMoney(bid)})`}
          />
          <BiddingScenario
            label="Likely Case"
            value={likelyCase}
            description={`Half cost (-${formatMoney(Math.ceil(bid / 2))})`}
            bordered
          />
          <BiddingScenario
            label="Best Case"
            value={bestCase}
            description="Free (-$0)"
          />
        </div>
      </div>
    </div>
  );
}

function BiddingScenario({
  label,
  value,
  description,
  bordered,
}: {
  label: string;
  value: number;
  description: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`${styles.biddingScenario} ${bordered ? styles.biddingScenarioBordered : ""}`}
    >
      <div className={styles.scenarioLabel}>{label}</div>
      <div
        className={`${styles.scenarioValue} ${value >= 0 ? styles.valuePositive : styles.valueNegative}`}
      >
        {formatMoney(value)}
      </div>
      <div className={styles.scenarioDescription}>{description}</div>
      {value < 0 && (
        <div className={styles.scenarioNeeds}>
          Needs {formatMoney(Math.abs(value))}
        </div>
      )}
    </div>
  );
}

function EliminatedExpandedView() {
  return (
    <div className={styles.eliminatedMessage}>
      <div className={styles.eliminatedIconWrapper}>
        <Icon name="warning sign" size="big" style={{ color: "#dc2626" }} />
      </div>
      <h3 className={styles.eliminatedTitle}>Eliminated (Insolvency)</h3>
      <p className={styles.eliminatedDescription}>
        This player was unable to pay their expenses and their income dropped
        below $0.
      </p>
    </div>
  );
}

interface ScoreTooltipContentProps {
  player: PlayerData;
}

export function ScoreTooltipContent({ player }: ScoreTooltipContentProps) {
  const playerHelper = useInjected(PlayerHelper);
  const incomePoints = playerHelper.getScoreFromIncome(player);
  const sharePoints = playerHelper.getScoreFromShares(player);
  const trackPoints = playerHelper.getScoreFromTrack(player);
  const trackCount = playerHelper.countTrack(player.color);
  const totalScore = playerHelper.getScore(player)[0];

  return (
    <div className={styles.tooltipContent}>
      <div className={styles.tooltipTitle}>Score Breakdown</div>
      <table className={styles.tooltipTable}>
        <tbody>
          <tr>
            <td className={styles.tooltipLabel}>Income points ({player.income} × 3):</td>
            <td className={`${styles.tooltipValue} ${styles.valuePositive}`}>+{incomePoints}</td>
          </tr>
          <tr>
            <td className={styles.tooltipLabel}>Share penalty ({player.shares} × -3):</td>
            <td className={`${styles.tooltipValue} ${styles.valueNegative}`}>{sharePoints}</td>
          </tr>
          <tr>
            <td className={styles.tooltipLabel}>Track points ({trackCount} sections × 1):</td>
            <td className={`${styles.tooltipValue} ${styles.valuePositive}`}>+{trackPoints}</td>
          </tr>
          <tr className={styles.tooltipTotalRow}>
            <td className={styles.tooltipLabel}>Total:</td>
            <td className={styles.tooltipValue}>{totalScore}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
