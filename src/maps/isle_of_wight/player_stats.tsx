import { Popup } from "semantic-ui-react";
import { useInjectedState } from "../../client/utils/injection_context";
import { goodStyle } from "../../client/grid/good";
import { PlayerData } from "../../engine/state/player";
import { HAGGLE_COUPONS, PLAYER_TRAINS } from "./state";
import { cardBoxes, TrainCard } from "./train_data";
import * as styles from "./trains_panel.module.css";

export function TrainsCell({ player }: { player: PlayerData }) {
  const playerTrains = useInjectedState(PLAYER_TRAINS);
  const trains = playerTrains.get(player.color) ?? [];
  if (trains.length === 0) return <>—</>;
  return (
    <>
      {trains.map((card, index) => (
        <Popup
          key={index}
          on={["hover", "click"]}
          position="top center"
          className="train-tooltip"
          content={
            <div>
              <div className={styles.tooltipTitle}>
                {card.tier}-train{card.used ? " (used)" : ""}
              </div>
              <span className={styles.trainRanges}>
                <TrainCardRanges card={card} showNumbers />
              </span>
            </div>
          }
          trigger={
            <span
              className={`${styles.trainRanges} ${card.used ? styles.trainRangesUsed : ""}`}
            >
              <TrainCardRanges card={card} />
            </span>
          }
        />
      ))}
    </>
  );
}

function TrainCardRanges({
  card,
  showNumbers,
}: {
  card: TrainCard;
  /** Show the range even in loaded boxes. */
  showNumbers?: boolean;
}) {
  return (
    <>
      {cardBoxes(card).map(({ range, good }, index) => (
        <span
          key={index}
          className={`${styles.rangeBox} ${
            good != null ? `${styles.rangeBoxLoaded} ${goodStyle(good)}` : ""
          } ${good != null && showNumbers ? styles.rangeBoxNumbered : ""}`}
        >
          {good == null || showNumbers ? range : null}
        </span>
      ))}
    </>
  );
}

export function CouponsCell({ player }: { player: PlayerData }) {
  const coupons = useInjectedState(HAGGLE_COUPONS);
  return <>{coupons.get(player.color) ?? 0}</>;
}
