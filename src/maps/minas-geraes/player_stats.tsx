import { useInjectedState } from "../../client/utils/injection_context";
import { PlayerData } from "../../engine/state/player";
import { MiningExpertise } from "./mining";

export function MiningExpertiseCell({ player }: { player: PlayerData }) {
  const miningExpertise = useInjectedState(MiningExpertise);
  const count = miningExpertise.get(player.color)!;
  return <>{count}</>;
}
