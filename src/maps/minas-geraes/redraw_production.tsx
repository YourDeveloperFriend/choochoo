import { useEmptyAction } from "../../client/services/action";
import { Button, Icon } from "semantic-ui-react";
import { ProductionSummary } from "../../client/game/production_summary";
import { RedrawProductionAction } from "./production";

/**
 * Minas Geraes keeps the base production action, so it needs the base production
 * summary as well as its own redraw button. Taking over the goods growth action
 * summary would otherwise replace it.
 */
export function RedrawProduction() {
  return (
    <>
      <ProductionSummary />
      <RedrawButton />
    </>
  );
}

function RedrawButton() {
  const { emit, canEmit } = useEmptyAction(RedrawProductionAction);

  if (!canEmit) {
    return <></>;
  }

  return (
    <div style={{ marginTop: "1em" }}>
      <Button icon labelPosition="left" color="olive" onClick={emit}>
        <Icon name="cube" />
        Redraw yellow cubes
      </Button>
    </div>
  );
}
