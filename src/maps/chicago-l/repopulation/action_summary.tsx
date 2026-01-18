import { useAction } from "../../../client/services/action";
import { useInject } from "../../../client/utils/injection_context";
import { injectState } from "../../../engine/framework/execution_context";
import * as React from "react";
import { useCallback } from "react";
import { Good, goodToString } from "../../../engine/state/good";
import { Username } from "../../../client/components/username";
import { DropdownProps, Form, FormGroup, FormSelect } from "semantic-ui-react";
import {
  GenericMessage,
  SpecialActionSelector,
} from "../../../client/game/action_summary";
import { RepopulateAction } from "./repopulate";
import { REPOPULATION } from "./state";

export function ChicagoLSelectAction() {
  return (
    <>
      <Repopulate />
      <SpecialActionSelector />
    </>
  );
}

function Repopulate() {
  const { canEmit, canEmitUserId, data, setData } = useAction(RepopulateAction);
  const repopulateData = useInject(() => {
    const state = injectState(REPOPULATION);
    return state.isInitialized() ? [...new Set(state())] : undefined;
  }, []);

  const selectGood = useCallback((good: Good) => setData({ good }), [setData]);

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit || repopulateData == null) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must repopulate a city.
      </GenericMessage>
    );
  }

  return (
    <div>
      You must repopulate a city. Select the good you want to use and then click
      on a city.
      <Form>
        <FormGroup>
          <FormSelect
            value={data?.good}
            onChange={(
              event: React.SyntheticEvent<HTMLElement>,
              data: DropdownProps,
            ) => {
              selectGood(data.value as Good);
            }}
            options={repopulateData!.map((good) => {
              return {
                key: good,
                value: good,
                text: goodToString(good),
              };
            })}
          />
        </FormGroup>
      </Form>
    </div>
  );
}
