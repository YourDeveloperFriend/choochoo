import { Good, goodToString } from "../../engine/state/good";
import { useAction } from "../../client/services/action";
import { useInjectedState } from "../../client/utils/injection_context";
import { Username } from "../../client/components/username";
import { PRODUCTION_STATE, ProductionAction } from "./production";
import * as React from "react";
import { useState } from "react";
import {
  GenericMessage,
  SpecialActionSelector,
} from "../../client/game/action_summary";
import { DropdownProps, Form, FormGroup, FormSelect } from "semantic-ui-react";

export function DoubleBaseUsaSpecialActionSelector() {
  const productionState = useInjectedState(PRODUCTION_STATE);
  if (productionState.goods.length === 0) {
    return <SpecialActionSelector />;
  }
  return <PlaceGood goods={productionState.goods} />;
}

function PlaceGood({ goods }: { goods: Good[] }) {
  const { isPending, canEmit, canEmitUserId, setData } =
    useAction(ProductionAction);

  const [selectedGood, setSelectedGood] = useState<number>(-1);

  if (canEmitUserId == null) {
    return <></>;
  }
  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must place cubes drawn for
        production.
      </GenericMessage>
    );
  }

  return (
    <div>
      <p>
        {canEmit ? "You" : <Username userId={canEmitUserId} />} drew{" "}
        {goods.map(goodToString).join(", ")}
      </p>
      <p>
        Select the color of the good you want to add and then click on the city
        on the map.
      </p>
      <Form>
        <FormGroup>
          <FormSelect
            disabled={isPending}
            value={selectedGood}
            onChange={(
              event: React.SyntheticEvent<HTMLElement>,
              data: DropdownProps,
            ) => {
              const idx = data.value as number;
              setSelectedGood(idx);
              setData({ good: goods[idx] });
            }}
            options={goods.map((good, idx) => {
              return {
                key: idx,
                value: idx,
                text: goodToString(good),
              };
            })}
          />
        </FormGroup>
      </Form>
    </div>
  );
}
