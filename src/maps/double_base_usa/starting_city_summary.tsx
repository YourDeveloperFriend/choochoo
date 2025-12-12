import { goodToString } from "../../engine/state/good";
import { useAction, useEmptyAction } from "../../client/services/action";
import {
  useGrid,
  useInjectedState,
} from "../../client/utils/injection_context";
import { Username } from "../../client/components/username";
import * as React from "react";
import { useState } from "react";
import { GenericMessage } from "../../client/game/action_summary";
import {
  SELECT_STARTING_CITY_REQUIRED,
  SelectStartingCityAction,
} from "./starting_city";
import { Build } from "../../client/game/build_action_summary";
import { StartingCityMarkers } from "./starter";
import {
  Button,
  DropdownProps,
  Form,
  FormGroup,
  FormSelect,
  Icon,
} from "semantic-ui-react";
import { DoubleBaseUsaSpendLandGrantAction } from "./build";
import { DoubleBaseUsaMapData } from "./grid";
import { DropdownItemProps } from "semantic-ui-react/dist/commonjs/modules/Dropdown/DropdownItem";

export function DoubleBaseUsaBuildPhaseSummary() {
  const selectStartingCityRequired = useInjectedState(
    SELECT_STARTING_CITY_REQUIRED,
  );
  const spendLandGrantAction = useEmptyAction(
    DoubleBaseUsaSpendLandGrantAction,
  );

  if (selectStartingCityRequired) {
    return <SelectStartingCitySummary />;
  }

  return (
    <>
      <Build />
      {spendLandGrantAction.canEmit ? (
        <div style={{ marginTop: "1em" }}>
          <Button
            icon
            labelPosition="left"
            color="olive"
            disabled={
              !spendLandGrantAction.canEmit && !spendLandGrantAction.isPending
            }
            loading={spendLandGrantAction.isPending}
            onClick={() => spendLandGrantAction.emit()}
          >
            <Icon name="money" />
            Spend Land Grant
          </Button>
        </div>
      ) : null}
    </>
  );
}

function SelectStartingCitySummary() {
  const { canEmit, canEmitUserId, isPending, setData } = useAction(
    SelectStartingCityAction,
  );
  const startingCityMarkers = useInjectedState(StartingCityMarkers);

  const [selectedStartingCity, setSelectedStartingCity] = useState<number>(-1);

  if (canEmitUserId == null) {
    return <></>;
  }
  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must select a starting city.
      </GenericMessage>
    );
  }

  const options: DropdownItemProps[] =
    startingCityMarkers.length === 0
      ? [{ key: -1, value: -1, text: "(colorless)" }]
      : startingCityMarkers.map((marker, idx) => {
          return {
            key: idx,
            value: idx,
            text: goodToString(marker),
          };
        });

  return (
    <div>
      <p>
        Select the color of your starting city and then click on the city on the
        map.
      </p>
      <Form>
        <FormGroup>
          <FormSelect
            disabled={isPending}
            value={selectedStartingCity}
            onChange={(
              event: React.SyntheticEvent<HTMLElement>,
              data: DropdownProps,
            ) => {
              const idx = data.value as number;
              setSelectedStartingCity(idx);
              setData({
                color: idx === -1 ? undefined : startingCityMarkers[idx],
              });
            }}
            options={options}
          />
        </FormGroup>
      </Form>
    </div>
  );
}
