import { useState } from "react";
import { Button } from "semantic-ui-react";
import { Username } from "../../client/components/username";
import { GenericMessage } from "../../client/game/action_summary";
import { useAction } from "../../client/services/action";
import {
  useCurrentPlayer,
  useInjectedState,
} from "../../client/utils/injection_context";
import { MAX_REPAIRS, RepairCrewAction } from "./repair_crew";
import { PLAYER_TRAINS } from "./state";
import { TrainCardView } from "./trains_panel";
import * as styles from "./trains_panel.module.css";

export function IsleOfWightRepairCrewSummary() {
  const {
    canEmit,
    canEmitUserId,
    isPending,
    emit: emitRepair,
  } = useAction(RepairCrewAction);

  const currentPlayer = useCurrentPlayer();
  const playerTrains = useInjectedState(PLAYER_TRAINS);
  const [selected, setSelected] = useState<number[]>([]);

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit || currentPlayer == null) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must resolve their Repair Crew.
      </GenericMessage>
    );
  }

  const trains = playerTrains.get(currentPlayer.color) ?? [];
  const selectedPerTrain: Map<number, number> = new Map();
  for (const trainIndex of selected) {
    selectedPerTrain.set(
      trainIndex,
      (selectedPerTrain.get(trainIndex) ?? 0) + 1,
    );
  }

  const toggle = (trainIndex: number) => {
    // If two removals have already been selected, just reset
    if (selected.length >= 2) {
      setSelected([]);
      return;
    }

    // If we have already selected as many goods as this train has, just reset
    if (
      (selectedPerTrain.get(trainIndex) ?? 0) >= trains[trainIndex].goods.length
    ) {
      setSelected([]);
      return;
    }

    // Otherwise we can have another removal possible on this train, so just add it to the removal list
    setSelected([...selected, trainIndex]);
  };

  return (
    <div style={{ marginTop: "1em" }}>
      <GenericMessage>
        Your Repair Crew may remove up to {MAX_REPAIRS} goods, in total, from
        your trains. Click a train multiple times to remove multiple goods from
        it.
      </GenericMessage>
      <div className={styles.cardList}>
        {trains.map((card, trainIndex) => (
          <TrainCardView
            key={trainIndex}
            card={card}
            highlightCount={selectedPerTrain.get(trainIndex) ?? 0}
            onClick={() => toggle(trainIndex)}
          />
        ))}
      </div>
      <Button
        primary
        disabled={isPending}
        onClick={() => emitRepair({ removals: selected })}
      >
        Remove selected
      </Button>
    </div>
  );
}
