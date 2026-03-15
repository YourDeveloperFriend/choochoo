import { useEmptyAction } from "../../client/services/action";
import { Button } from "semantic-ui-react";
import { RedrawProductionAction } from "./production";

export function RedrawProduction() {
  const { emit, canEmit } = useEmptyAction(RedrawProductionAction);

  if (!canEmit) {
    return <></>;
  }

  return (
    <div style={{ marginTop: "1em" }}>
      <Button icon labelPosition="left" color="olive" onClick={emit}>
        Redraw yellow cubes
      </Button>
    </div>
  );
}
