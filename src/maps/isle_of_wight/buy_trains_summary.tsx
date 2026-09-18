import { Button } from "semantic-ui-react";
import { Username } from "../../client/components/username";
import { GenericMessage } from "../../client/game/action_summary";
import { useAction, useEmptyAction } from "../../client/services/action";
import {
  useCurrentPlayer,
  useInjectedState,
} from "../../client/utils/injection_context";
import { BuyTrainsAction, BuyTrainsPassAction } from "./buy_trains";
import { HAGGLE_COUPONS, TRAIN_DECK } from "./state";
import { TRAIN_TIER_NOTES, TRAIN_TIERS } from "./train_data";

export function IsleOfWightBuyTrainsSummary() {
  const {
    canEmit,
    canEmitUserId,
    emit: emitBuy,
    isPending: buyPending,
  } = useAction(BuyTrainsAction);
  const { emit: emitPass, isPending: passPending } =
    useEmptyAction(BuyTrainsPassAction);

  const currentPlayer = useCurrentPlayer();
  const couponState = useInjectedState(HAGGLE_COUPONS);

  const isPending = buyPending || passPending;

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit || currentPlayer == null) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> may buy trains.
      </GenericMessage>
    );
  }

  const coupons = couponState.get(currentPlayer.color) ?? 0;
  return (
    <div>
      <TrainDeckElement />
      <Button.Group>
        <Button
          primary
          icon="train"
          disabled={isPending}
          onClick={() => emitBuy({ coupons: 0 })}
        >
          Buy next train
        </Button>
        {coupons >= 1 ? (
          <>
            <Button.Or />
            <Button
              secondary
              icon="coupon"
              disabled={isPending}
              onClick={() => emitBuy({ coupons: 1 })}
            >
              Spend 1 coupon
            </Button>
          </>
        ) : null}
        {coupons >= 2 ? (
          <>
            <Button.Or />
            <Button
              secondary
              icon="coupon"
              disabled={isPending}
              onClick={() => emitBuy({ coupons: 2 })}
            >
              Spend 2 coupons
            </Button>
          </>
        ) : null}
      </Button.Group>
      <br />
      <Button negative icon="close" disabled={isPending} onClick={emitPass}>
        Pass buying trains
      </Button>
    </div>
  );
}

function TrainDeckElement() {
  const deck = useInjectedState(TRAIN_DECK);

  return (
    <ul>
      {TRAIN_TIERS.map(({ tier, cost }) => {
        const remaining = deck.get(tier) ?? 0;
        if (remaining === 0) return null;
        const note = TRAIN_TIER_NOTES[tier - 1];
        return (
          <li key={tier}>
            {remaining}x {tier}-train (${cost}){note != null && <> — {note}</>}
          </li>
        );
      })}
    </ul>
  );
}
