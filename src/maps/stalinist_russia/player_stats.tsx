import { useInjectedState } from "../../client/utils/injection_context";
import { PlayerData } from "../../engine/state/player";
import { DISFAVOR_TRACK, DISFAVOR_VALUES } from "./state";

export function DisfavorCell({ player }: { player: PlayerData }) {
  const disfavorTrack = useInjectedState(DISFAVOR_TRACK);
  const index = disfavorTrack.get(player.color) ?? 0;
  return <>{DISFAVOR_VALUES[index]}</>;
}
