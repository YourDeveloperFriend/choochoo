import * as React from "react";
import {
  Button,
  DropdownProps,
  Form,
  FormGroup,
  FormSelect,
} from "semantic-ui-react";
import { Good, goodToString } from "../../engine/state/good";
import { GenericMessage } from "../../client/game/action_summary";
import { useAction, useEmptyAction } from "../../client/services/action";
import { useInjectedState } from "../../client/utils/injection_context";
import { Username } from "../../client/components/username";
import { MexicoPickRoleAction } from "./role_selection";
import {
  MexicoProductionDrawAction,
  MexicoProductionPassAction,
  MexicoProductionPlaceAction,
  MEXICO_PRODUCTION_GOODS,
} from "./goods_growth";

export function MexicoRoleSelectionSummary() {
  const { canEmit, canEmitUserId, emit, isPending } =
    useAction(MexicoPickRoleAction);

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must choose roles.
      </GenericMessage>
    );
  }

  return (
    <div>
      <p>Choose your role:</p>
      <p style={{ fontStyle: "italic" }}>
        If you haven&apos;t coordinated role selection with your partner, select
        Randomize.
      </p>
      <Button.Group>
        <Button
          disabled={isPending}
          loading={isPending}
          onClick={() => emit({ role: "state" })}
        >
          Play as State
        </Button>
        <Button.Or />
        <Button
          disabled={isPending}
          loading={isPending}
          onClick={() => emit({ role: "cartel" })}
        >
          Play as Cartel
        </Button>
        <Button.Or />
        <Button
          disabled={isPending}
          loading={isPending}
          onClick={() => emit({ role: "random" })}
        >
          Randomize
        </Button>
      </Button.Group>
    </div>
  );
}

export function MexicoProductionSummary() {
  const drawAction = useEmptyAction(MexicoProductionDrawAction);
  const passAction = useEmptyAction(MexicoProductionPassAction);
  const placeAction = useAction(MexicoProductionPlaceAction);
  const drawnGoods = useInjectedState(MEXICO_PRODUCTION_GOODS);

  const canEmitUserId =
    drawAction.canEmitUserId ??
    passAction.canEmitUserId ??
    placeAction.canEmitUserId;

  if (canEmitUserId == null) {
    return <></>;
  }

  // Waiting on the other player
  if (!drawAction.canEmit && !passAction.canEmit && !placeAction.canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must produce.
      </GenericMessage>
    );
  }

  // Goods have been drawn — player must place one on a city
  if (placeAction.canEmit) {
    return (
      <div>
        <p>Select the good to place on a city, then click a city on the map.</p>
        <Form>
          <FormGroup>
            <FormSelect
              value={placeAction.data?.good}
              onChange={(
                _e: React.SyntheticEvent<HTMLElement>,
                d: DropdownProps,
              ) => placeAction.setData({ good: d.value as Good })}
              options={(drawnGoods ?? []).map((good) => ({
                key: good,
                value: good,
                text: goodToString(good),
              }))}
              placeholder="Select a good"
            />
          </FormGroup>
        </Form>
      </div>
    );
  }

  // Player must decide: draw or pass
  return (
    <div>
      <p>Production: draw 2 goods and place 1 on a city, or pass.</p>
      <Button.Group>
        <Button
          primary
          disabled={drawAction.isPending}
          loading={drawAction.isPending}
          onClick={() => drawAction.emit()}
        >
          Draw
        </Button>
        <Button.Or />
        <Button
          disabled={passAction.isPending}
          loading={passAction.isPending}
          onClick={() => passAction.emit()}
        >
          Pass
        </Button>
      </Button.Group>
    </div>
  );
}
