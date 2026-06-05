import * as React from "react";
import { Button } from "semantic-ui-react";
import { GenericMessage } from "../../client/game/action_summary";
import { useAction } from "../../client/services/action";
import { useActiveGameState } from "../../client/utils/injection_context";
import { Username } from "../../client/components/username";
import {
  CyprusPickCountryAction,
  CYPRUS_SELECTION_STATE,
} from "./role_selection";
import { ALL_COUNTRIES, countryName } from "./roles";

export function CyprusRoleSelectionSummary() {
  const { canEmit, canEmitUserId, emit, isPending } = useAction(
    CyprusPickCountryAction,
  );
  const selectionState = useActiveGameState(CYPRUS_SELECTION_STATE);

  if (canEmitUserId == null) return <></>;

  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must choose a country.
      </GenericMessage>
    );
  }

  const taken = new Set(selectionState?.assignments.map((a) => a.country));
  const available = ALL_COUNTRIES.filter((c) => !taken.has(c));

  return (
    <div>
      <p>Choose your country:</p>
      <p style={{ fontStyle: "italic" }}>
        If you haven&apos;t coordinated countries with the other players, select
        Randomize.
      </p>
      <Button.Group>
        {available.map((country, i) => (
          <React.Fragment key={country}>
            {i > 0 && <Button.Or />}
            <Button
              disabled={isPending}
              loading={isPending}
              onClick={() => emit({ country })}
            >
              Play as {countryName(country)}
            </Button>
          </React.Fragment>
        ))}
        <Button.Or />
        <Button
          disabled={isPending}
          loading={isPending}
          onClick={() => emit({ country: "randomize" })}
        >
          Randomize
        </Button>
      </Button.Group>
    </div>
  );
}
