import { GoodsTable } from "../../client/game/goods_table";
import {
  GenericMessage,
  SpecialActionSelector,
} from "../../client/game/action_summary";
import { Username } from "../../client/components/username";
import { useAction } from "../../client/services/action";
import { OahuProductionAction } from "./production";

/**
 * Production is chosen and resolved in a single turn during action
 * selection, so the normal action selector is shown until someone is
 * actually mid-production and needs to click a column.
 */
export function OahuActionSelector() {
  const { canEmitUserId } = useAction(OahuProductionAction);
  if (canEmitUserId == null) {
    return <SpecialActionSelector />;
  }
  return <OahuProduction />;
}

function OahuProduction() {
  const { canEmit, canEmitUserId, emit } = useAction(OahuProductionAction);

  if (canEmitUserId == null) {
    return <></>;
  }

  return (
    <div>
      {canEmit ? (
        <GenericMessage>
          Click one of the two cubes in a goods growth column. That cube stays
          on the Starting City; the other cube in the column moves to the New
          City.
        </GenericMessage>
      ) : (
        <GenericMessage>
          <Username userId={canEmitUserId} /> must choose a cube to produce.
        </GenericMessage>
      )}
      <GoodsTable
        onClickSlot={({ cityGroup, onRoll, row }) =>
          emit({ cityGroup, onRoll, row })
        }
        // Only Starting City columns ever hold waiting cubes now.
        isSlotClickable={(slot, good) =>
          canEmit && !slot.urbanized && good != null
        }
      />
    </div>
  );
}
