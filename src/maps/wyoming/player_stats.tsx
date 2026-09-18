import { useInjectedState } from "../../client/utils/injection_context";
import { PlayerData } from "../../engine/state/player";
import { WyomingLocoDiscs } from "./locomotive";

export function LocoDiscCell({ player }: { player: PlayerData }) {
  const locoDiscs = useInjectedState(WyomingLocoDiscs);
  return <>{locoDiscs.get(player.color) ?? 0}</>;
}
