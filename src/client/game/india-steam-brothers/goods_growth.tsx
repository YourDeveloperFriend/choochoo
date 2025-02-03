import { useCallback } from "react";
import { Good, goodToString } from "../../../engine/state/good";
import {
  InProgressProduction,
  PRODUCTION_STATE,
  SelectCityAction,
  SelectGoodAction,
} from "../../../maps/india-steam-brothers/production";
import { DropdownMenu, DropdownMenuItem } from "../../components/dropdown_menu";
import { Username } from "../../components/username";
import { useAction } from "../../services/game";
import { useInjectedState } from "../../utils/injection_context";
import { GenericMessage } from "../action_summary";

export function ManualGoodsGrowth() {
  const state = useInjectedState(PRODUCTION_STATE);

  return state.production != null ? (
    <SelectGood production={state.production} />
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

function SelectGood({ production }: { production: InProgressProduction }) {
  const { canEmit, isPending, canEmitUserId } = useAction(SelectGoodAction);

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
      <DropdownMenu id="select-good" title="Select good" disabled={isPending}>
        {production.goods.map((good) => (
          <GoodDropdownMenuItem key={good} good={good} />
        ))}
      </DropdownMenu>
    </div>
  );
}

function GoodDropdownMenuItem({ good }: { good: Good }) {
  const { emit, isPending } = useAction(SelectGoodAction);

  return (
    <DropdownMenuItem
      onClick={useCallback(() => emit({ good }), [good])}
      disabled={isPending}
    >
      {goodToString(good)}
    </DropdownMenuItem>
  );
}
