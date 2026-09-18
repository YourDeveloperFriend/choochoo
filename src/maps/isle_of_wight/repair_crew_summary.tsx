import { useState } from "react";
import { Button } from "semantic-ui-react";
import { Username } from "../../client/components/username";
import { GenericMessage } from "../../client/game/action_summary";
import { GoodBlock } from "../../client/game/goods_table";
import { useAction } from "../../client/services/action";
import {
  useCurrentPlayer,
  useInjectedState,
} from "../../client/utils/injection_context";
import { MAX_REPAIRS, RepairCrewAction } from "./repair_crew";
import { PLAYER_TRAINS } from "./state";

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
    <div>
      <GenericMessage>
        Your Repair Crew may remove up to {MAX_REPAIRS} goods, in total, from
        your trains.
      </GenericMessage>
      {trains.map((card, trainIndex) => (
        <div key={trainIndex} onClick={() => toggle(trainIndex)}>
          <span>{card.tier}-train: </span>
          {card.goods.length === 0 && <span>no goods</span>}
          {card.goods.map((good, boxIndex) => {
            const highlighted =
              card.goods.length - boxIndex >=
              (selectedPerTrain.get(trainIndex) ?? 0);
            return (
              <GoodBlock
                key={boxIndex}
                good={good}
                clickable
                highlighted={highlighted}
              />
            );
          })}
        </div>
      ))}
      <Button
        primary
        disabled={isPending || selected.length === 0}
        onClick={() => emitRepair({ removals: selected })}
      >
        Remove selected
      </Button>
    </div>
  );
}
