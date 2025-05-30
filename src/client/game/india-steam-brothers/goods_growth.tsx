import {useCallback, useState} from "react";
import { Good, goodToString } from "../../../engine/state/good";
import {
  InProgressProduction,
  PRODUCTION_STATE,
  SelectCityAction,
  SelectGoodAction,
} from "../../../maps/india-steam-brothers/production";
import { Username } from "../../components/username";
import { useAction } from "../../services/action";
import { useInjectedState } from "../../utils/injection_context";
import { GenericMessage } from "../action_summary";
import {Button, DropdownProps, Form, FormGroup, FormSelect} from "semantic-ui-react";

export function ManualGoodsGrowth() {
  const state = useInjectedState(PRODUCTION_STATE);

  return state.production != null ? (
    <SelectGoodForGoodsGrowth production={state.production} />
  ) : (
    <SelectCity />
  );
}

function SelectCity() {
  const { canEmit, canEmitUserId } = useAction(SelectCityAction);

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must select a city to perform the
        production action.
      </GenericMessage>
    );
  }

  return (
    <GenericMessage>
      You must select a city to perform the production action.
    </GenericMessage>
  );
}

function SelectGoodForGoodsGrowth({
  production,
}: {
  production: InProgressProduction;
}) {
  const { emit, canEmit, isPending, canEmitUserId } =
    useAction(SelectGoodAction);

  const select = useCallback((good: Good) => emit({ good }), [emit]);

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must select a good:{" "}
        {production.goods.map(goodToString).join(", ")}.
      </GenericMessage>
    );
  }

  return (
    <div>
      <GenericMessage>You must select a good.</GenericMessage>
      <GoodSelector
        goods={production.goods}
        disabled={isPending}
        onSelect={select}
      />
    </div>
  );
}

interface GoodSelectorProps {
  goods: Good[];
  disabled?: boolean;
  selected?: Good;
  onSelect(good: Good): void;
}

function GoodSelector({
  goods,
  disabled,
  selected,
  onSelect,
}: GoodSelectorProps) {
  const [selectedGood, setSelectedGood] = useState<Good|undefined>(selected);

  return (
      <Form>
        <FormGroup>
          <FormSelect
              disabled={disabled}
              value={selectedGood}
              onChange={(event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
                setSelectedGood(data.value as Good);
              }}
              options={goods.map((good) => {
                return {
                  key: good,
                  value: good,
                  text: goodToString(good)
                }
              })}
          />
          <Button primary onClick={() => onSelect(selectedGood as Good)} disabled={!selectedGood || disabled}>Select Good</Button>
        </FormGroup>
      </Form>
  );
}
