import {
  useCurrentPlayer,
  useInject,
  useInjectedState,
} from "../../client/utils/injection_context";
import { Build } from "../../client/game/build_action_summary";
import { inject } from "../../engine/framework/execution_context";
import { BuilderHelper } from "../../engine/build/helper";
import { HAS_BUILT_FACTORY } from "./build";
import { useEmptyAction } from "../../client/services/action";
import { DoneAction } from "../../engine/build/done";
import { FACTORY_ACTION } from "./actions";

export function BuildActionSummary() {
  const { canEmit } = useEmptyAction(DoneAction);
  const hasBuiltFactory = useInjectedState(HAS_BUILT_FACTORY);
  const player = useCurrentPlayer();
  const buildsRemaining = useInject(() => {
    return inject(BuilderHelper).buildsRemaining();
  }, []);

  const canBuildFactory =
    !hasBuiltFactory &&
    (buildsRemaining >= 3 || player?.selectedAction === FACTORY_ACTION);

  return (
    <>
      <Build />
      {canEmit && canBuildFactory ? (
        <div style={{ marginTop: "1em", fontStyle: "italic" }}>
          To build a factory, click on a city.
        </div>
      ) : null}
    </>
  );
}
