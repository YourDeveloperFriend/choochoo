import { Button, Header } from "semantic-ui-react";
import { Username } from "../../client/components/username";
import { GenericMessage } from "../../client/game/action_summary";
import { useAction, useEmptyAction } from "../../client/services/action";
import {
  useCurrentPlayer,
  useInjectedState,
} from "../../client/utils/injection_context";
import { BuyTrainsAction, BuyTrainsPassAction } from "./buy_trains";
import { HAGGLE_COUPONS, PLAYER_TRAINS } from "./state";
import { TrainCardView, TrainDeckTable } from "./trains_panel";

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
  const playerTrains = useInjectedState(PLAYER_TRAINS);
  const trains = currentPlayer
    ? (playerTrains.get(currentPlayer.color) ?? [])
    : [];
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
    <div style={{ marginTop: "1em" }}>
      <Header as="h3">Your Trains</Header>
      {trains.length === 0
        ? "—"
        : trains.map((train, index) => (
            <TrainCardView key={index} card={train} />
          ))}
      <Header as="h3">Train Deck</Header>
      <TrainDeckTable />
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
        <Button.Or />
        <Button negative icon="close" disabled={isPending} onClick={emitPass}>
          Pass buying trains
        </Button>
      </Button.Group>
    </div>
  );
}
