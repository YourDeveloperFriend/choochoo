import { useInjectedState } from "../../client/utils/injection_context";
import { PlayerData } from "../../engine/state/player";
import { DoubleBaseUsaPlayerData } from "./starter";

export function BonusLocoCell({ player }: { player: PlayerData }) {
  const playerData = useInjectedState(DoubleBaseUsaPlayerData);
  const count = playerData.get(player.color)!.locoDiscs;
  return <>{count}</>;
}

export function LandGrantCell({ player }: { player: PlayerData }) {
  const playerData = useInjectedState(DoubleBaseUsaPlayerData);
  const count = playerData.get(player.color)!.landGrants;
  return <>{count}</>;
}
