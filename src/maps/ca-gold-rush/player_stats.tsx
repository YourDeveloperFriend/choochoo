import { useInjectedState } from "../../client/utils/injection_context";
import { OwnedGold } from "./score";
import { PlayerData } from "../../engine/state/player";

export function GoldCell({ player }: { player: PlayerData }) {
  const ownedGold = useInjectedState(OwnedGold);
  const count = ownedGold.get(player.color)!;
  return <>{count}</>;
}
