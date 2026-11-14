import { Build } from "../../client/game/build_action_summary";
import {
  useCurrentPlayer,
  useInject,
} from "../../client/utils/injection_context";
import { inject, injectState } from "../../engine/framework/execution_context";
import {
  CURRENT_PLAYER,
  injectInitialPlayerCount,
} from "../../engine/game/state";
import { HoneybeeLinkRules, PAIRINGS_BEFORE_BUILD } from "./connections";

export function HoneybeeBuildSummary() {
  const player = useCurrentPlayer();
  const remaining = useInject(() => {
    if (
      injectInitialPlayerCount()() !== 5 ||
      !injectState(CURRENT_PLAYER).isInitialized()
    ) {
      return undefined;
    }
    const before = injectState(PAIRINGS_BEFORE_BUILD).getOr([]);
    const after = inject(HoneybeeLinkRules).ownedLargePairings();
    return 2 - after.filter((pair) => !before.includes(pair)).length;
  }, [player]);
  return (
    <>
      <Build />
      {remaining != null && (
        <p>
          Large-City pairings remaining this turn: {remaining}. Links to the
          central black City do not use this allowance.
        </p>
      )}
    </>
  );
}
