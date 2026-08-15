import { useState } from "react";
import { GoodsTable } from "../../client/game/goods_table";
import {
  GenericMessage,
  SpecialActionSelector,
} from "../../client/game/action_summary";
import { Username } from "../../client/components/username";
import { useAction } from "../../client/services/action";
import { CityGroup } from "../../engine/state/city_group";
import { OnRoll } from "../../engine/state/roll";
import { OahuProductionAction } from "./production";
import { Button } from "semantic-ui-react";

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

interface ColumnSelection {
  cityGroup: CityGroup;
  onRoll: OnRoll;
}

function OahuProduction() {
  const { canEmit, canEmitUserId, emit } = useAction(OahuProductionAction);
  const [selected, setSelected] = useState<ColumnSelection | undefined>(
    undefined,
  );

  if (canEmitUserId == null) {
    return <></>;
  }

  if (selected != null) {
    return (
      <div>
        <GenericMessage>
          Send these cubes to the Starting City or the New City?
        </GenericMessage>
        <Button.Group>
          <Button
            primary
            onClick={() => emit({ ...selected, toNewCity: false })}
          >
            Send to Starting City
          </Button>
          <Button.Or />
          <Button
            secondary
            onClick={() => emit({ ...selected, toNewCity: true })}
          >
            Send to New City
          </Button>
        </Button.Group>
      </div>
    );
  }

  return (
    <div>
      {canEmit ? (
        <GenericMessage>
          Click a column of the goods growth table. Every cube in it moves into
          either that column&apos;s Starting City or its New City.
        </GenericMessage>
      ) : (
        <GenericMessage>
          <Username userId={canEmitUserId} /> must choose a goods display column
          to produce.
        </GenericMessage>
      )}
      <GoodsTable
        onClickSlot={({ cityGroup, onRoll }) =>
          setSelected({ cityGroup, onRoll })
        }
        // Only Starting City columns ever hold waiting cubes now.
        isSlotClickable={(slot, good) =>
          canEmit && !slot.urbanized && good != null
        }
      />
    </div>
  );
}
