import { useInjectedState } from "../../client/utils/injection_context";
import { PlayerData } from "../../engine/state/player";
import { HAGGLE_COUPONS, PLAYER_TRAINS } from "./state";
import { nextRange } from "./train_data";

export function TrainsCell({ player }: { player: PlayerData }) {
  const playerTrains = useInjectedState(PLAYER_TRAINS);
  const trains = playerTrains.get(player.color) ?? [];
  if (trains.length === 0) return <>—</>;
  return (
    <>
      {trains
        .map((card) => {
          const range = nextRange(card);
          return `${card.tier} (${range == null ? "full" : range}${card.used ? ", used" : ""})`;
        })
        .join(", ")}
    </>
  );
}

export function CouponsCell({ player }: { player: PlayerData }) {
  const coupons = useInjectedState(HAGGLE_COUPONS);
  return <>{coupons.get(player.color) ?? 0}</>;
}
