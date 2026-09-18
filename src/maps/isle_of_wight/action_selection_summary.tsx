import { SpecialActionSelector } from "../../client/game/action_summary";
import { useCurrentPlayer } from "../../client/utils/injection_context";
import { IsleOfWightRepairCrewSummary } from "./repair_crew_summary";
import { Action } from "../../engine/state/action";

export function IsleOfWightActionSelectionSummary() {
  const currentPlayer = useCurrentPlayer();
  if (currentPlayer?.selectedAction === Action.REPAIR_CREW) {
    return <IsleOfWightRepairCrewSummary />;
  }
  return <SpecialActionSelector />;
}
