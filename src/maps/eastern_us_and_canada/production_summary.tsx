import { Good, goodToString } from "../../engine/state/good";
import { useAction } from "../../client/services/action";
import { useInjectedState } from "../../client/utils/injection_context";
import { Username } from "../../client/components/username";
import { PRODUCTION_STATE, ProductionAction } from "./production";
import * as React from "react";
import {
  GenericMessage,
  SpecialActionSelector,
} from "../../client/game/action_summary";

export function EasternUsAndCanadaSpecialActionSelector() {
  const productionState = useInjectedState(PRODUCTION_STATE);
  if (productionState.goods.length === 0) {
    return <SpecialActionSelector />;
  }
  return <PlaceGood goods={productionState.goods} />;
}

function PlaceGood({ goods }: { goods: Good[] }) {
  const { canEmit, canEmitUserId } = useAction(ProductionAction);
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
      <p>Select where to place {goodToString(goods[0])}.</p>
    </div>
  );
}
