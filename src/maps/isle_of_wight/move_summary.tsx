import { Button } from "semantic-ui-react";
import { MoveGoods } from "../../client/game/move_goods_action_summary";
import { useAction } from "../../client/services/action";
import {
  useCurrentPlayer,
  useInjectedState,
} from "../../client/utils/injection_context";
import { WorkInFactoriesAction } from "./factory";
import { PLAYER_TRAINS } from "./state";
import { describeTrain } from "./train_data";

export function IsleOfWightMoveSummary() {
  const { canEmit, data, setData, clearData, isPending } = useAction(
    WorkInFactoriesAction,
  );
  const currentPlayer = useCurrentPlayer();
  const playerTrains = useInjectedState(PLAYER_TRAINS);

  const trains = currentPlayer
    ? (playerTrains.get(currentPlayer.color) ?? [])
    : [];
  const unused = trains
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => !card.used);

  // FIXME: This needs to provide a UI for selecting which you you're going to use and setting the partial data on the IowMoveData

  return (
    <>
      <MoveGoods />
      {canEmit && unused.length > 0 && (
        <div style={{ marginTop: "1em" }}>
          {data?.trainIndex == null ? (
            <>
              <p>
                Or send a crew to work in the factories: exhaust a train to add
                a cube to a city you are connected to.
              </p>
              {unused.map(({ card, index }) => (
                <Button
                  key={index}
                  color="olive"
                  disabled={isPending}
                  onClick={() => setData({ trainIndex: index })}
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
              <Button disabled={isPending} onClick={clearData}>
                Cancel
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
}
