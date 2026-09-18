import { Button } from "semantic-ui-react";
import { MoveGoods } from "../../client/game/move_goods_action_summary";
import { useAction } from "../../client/services/action";
import {
  useCurrentPlayer,
  useInjectedState,
} from "../../client/utils/injection_context";
import { ActionConstructor } from "../../engine/game/phase_module";
import { MoveAction } from "../../engine/move/move";
import { WorkInFactoriesAction } from "./factory";
import { IsleOfWightMoveData } from "./move";
import { PLAYER_TRAINS } from "./state";
import { describeTrain } from "./train_data";

export function IsleOfWightMoveSummary() {
  const {
    canEmit: canEmitMove,
    data: moveData,
    setData: setMoveData,
    isPending: movePending,
  } = useAction(MoveAction as ActionConstructor<IsleOfWightMoveData>);
  const {
    canEmit: canEmitFactory,
    data: factoryData,
    setData: setFactoryData,
    clearData: clearFactoryData,
    isPending: factoryPending,
  } = useAction(WorkInFactoriesAction);
  const currentPlayer = useCurrentPlayer();
  const playerTrains = useInjectedState(PLAYER_TRAINS);

  const trains = currentPlayer
    ? (playerTrains.get(currentPlayer.color) ?? [])
    : [];
  const unused = trains
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => !card.used);

  const chosenTrain = unused.find(
    ({ index }) => index === moveData?.trainIndex,
  )?.card;

  return (
    <>
      <MoveGoods />
      {canEmitMove && unused.length > 0 && (
        <div style={{ marginTop: "1em" }}>
          <p>
            {chosenTrain == null
              ? "Choose a train to make a delivery with:"
              : `Click a good to deliver with your ${describeTrain(chosenTrain)}.`}
          </p>
          {unused.map(({ card, index }) => (
            <Button
              key={index}
              color="blue"
              active={index === moveData?.trainIndex}
              disabled={movePending}
              onClick={() => setMoveData({ trainIndex: index })}
            >
              Use {describeTrain(card)}
            </Button>
          ))}
        </div>
      )}
      {canEmitFactory && unused.length > 0 && (
        <div style={{ marginTop: "1em" }}>
          {factoryData?.trainIndex == null ? (
            <>
              <p>
                Or send a crew to work in the factories: exhaust a train to add
                a cube to a city you are connected to.
              </p>
              {unused.map(({ card, index }) => (
                <Button
                  key={index}
                  color="olive"
                  disabled={factoryPending}
                  onClick={() => setFactoryData({ trainIndex: index })}
                >
                  Use {describeTrain(card)}
                </Button>
              ))}
            </>
          ) : (
            <>
              <p>
                Click the city to add a cube to, or cancel. A cube matching the
                city&apos;s colour is taken from the bag.
              </p>
              <Button disabled={factoryPending} onClick={clearFactoryData}>
                Cancel
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
}
