import { PlayerData } from "../../engine/state/player";
import { useInjected } from "../../client/utils/injection_context";
import { MexicoRoleHelper } from "./roles";

export function RoleCell({ player }: { player: PlayerData }) {
  const roleHelper = useInjected(MexicoRoleHelper);
  if (!roleHelper.isInitialized()) {
    return "";
  }

  if (roleHelper.isState(player.color)) {
    return "State";
  } else {
    return "Cartel";
  }
}
