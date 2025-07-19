import { Button } from "semantic-ui-react";

import { GenericMessage } from "../../client/game/action_summary";
import { Username } from "../../client/components/username";
import { useEmptyAction } from "../../client/services/action";
import { ProductionPassAction } from "../../maps/poland/goods_growth";

export function PolandProduction() {
  const { canEmit, emit, isPending, canEmitUserId } =
    useEmptyAction(ProductionPassAction);

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must select a town to place the
        drawn cubes.
      </GenericMessage>
    );
  }

  return (
    <div>
      <p>You must select a town to place the drawn cubes.</p>
      <Button negative disabled={isPending} onClick={emit}>
        Pass
      </Button>
    </div>
  );
}
