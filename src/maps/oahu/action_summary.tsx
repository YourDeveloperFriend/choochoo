import { GoodsTable } from "../../client/game/goods_table";
import { GenericMessage } from "../../client/game/action_summary";
import { Username } from "../../client/components/username";
import { useAction } from "../../client/services/action";
import { IGNORED_GOOD, OahuProductionAction } from "./production";

export function OahuProduction() {
  const { canEmit, canEmitUserId, emit } = useAction(OahuProductionAction);

  if (canEmitUserId == null) {
    return <></>;
  }

  return (
    <div>
      {canEmit ? (
        <GenericMessage>
          Click a column of the goods growth table. Every cube in it moves into
          that column&apos;s city.
        </GenericMessage>
      ) : (
        <GenericMessage>
          <Username userId={canEmitUserId} /> must choose a goods display column
          to produce.
        </GenericMessage>
      )}
      <GoodsTable
        onClickSlot={({ urbanized, cityGroup, onRoll, row }) =>
          emit({ urbanized, cityGroup, onRoll, row, good: IGNORED_GOOD })
        }
        // The cubes already in the display are what moves, so they are the
        // targets rather than the empty slots.
        isSlotClickable={(_, good) => canEmit && good != null}
      />
    </div>
  );
}
