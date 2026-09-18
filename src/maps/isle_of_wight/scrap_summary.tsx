import { Button } from "semantic-ui-react";
import { Username } from "../../client/components/username";
import { GenericMessage } from "../../client/game/action_summary";
import { useAction, useEmptyAction } from "../../client/services/action";
import {
  useCurrentPlayer,
  useInjectedState,
} from "../../client/utils/injection_context";
import { ScrapAction, ScrapPassAction } from "./scrap";
import { PLAYER_TRAINS } from "./state";
import { TrainCardView } from "./trains_panel";

export function IsleOfWightScrapSummary() {
  const {
    canEmit,
    canEmitUserId,
    emit: emitScrap,
    isPending: scrapPending,
  } = useAction(ScrapAction);
  const { emit: emitPass, isPending: passPending } =
    useEmptyAction(ScrapPassAction);

  const currentPlayer = useCurrentPlayer();
  const playerTrains = useInjectedState(PLAYER_TRAINS);

  const isPending = scrapPending || passPending;

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit || currentPlayer == null) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> may scrap their trains.
      </GenericMessage>
    );
  }

  const trains = playerTrains.get(currentPlayer.color) ?? [];

  return (
    <div>
      <GenericMessage>
        You may scrap any of your trains. Goods on a scrapped train go back to
        the bag.
      </GenericMessage>
      {trains.map((card, index) => (
        <div key={index}>
          <Button
            primary
            disabled={isPending}
            onClick={() => emitScrap({ trainIndex: index })}
          >
            Scrap this train
          </Button>
          <TrainCardView card={card} />
        </div>
      ))}
      <Button negative disabled={isPending} onClick={emitPass}>
        Pass
      </Button>
    </div>
  );
}
