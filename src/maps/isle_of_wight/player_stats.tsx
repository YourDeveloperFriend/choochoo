import { useInjectedState } from "../../client/utils/injection_context";
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
        <span key={index} className={card.used ? styles.used : undefined}>
          {index > 0 ? ", " : ""}
          [<TrainCardRanges card={card} />]
        </span>
      ))}
    </>
  );
}

function TrainCardRanges({ card }: { card: TrainCard }) {
  return (
    <>
      {cardBoxes(card).map(({ range, good }, index) => (
        <span key={index}>
          {index > 0 ? ", " : ""}
          <span
            style={
              good != null ? { textDecoration: "line-through" } : undefined
            }
          >
            {range}
          </span>
        </span>
      ))}
    </>
  );
}

export function CouponsCell({ player }: { player: PlayerData }) {
  const coupons = useInjectedState(HAGGLE_COUPONS);
  return <>{coupons.get(player.color) ?? 0}</>;
}
