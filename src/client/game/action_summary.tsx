import { Button, Tooltip } from "@mui/material";
import { ReactNode, useCallback } from "react";
import { DoneAction } from "../../engine/build/done";
import { BuilderHelper } from "../../engine/build/helper";
import { inject } from "../../engine/framework/execution_context";
import { PHASE } from "../../engine/game/phase";
import { LocoAction } from "../../engine/move/loco";
import { MovePassAction } from "../../engine/move/pass";
import { SelectAction as ActionSelectionSelectAction } from "../../engine/select_action/select";
import { SkipAction } from "../../engine/select_action/skip";
import { ShareHelper } from "../../engine/shares/share_helper";
import { TakeSharesAction } from "../../engine/shares/take_shares";
import { Phase } from "../../engine/state/phase";
import { BidAction } from "../../engine/turn_order/bid";
import { TurnOrderHelper } from "../../engine/turn_order/helper";
import { PassAction } from "../../engine/turn_order/pass";
import { TurnOrderPassAction } from "../../engine/turn_order/turn_order_pass";
import { PassAction as DeurbanizationPassAction } from "../../maps/ireland/deurbanization";
import { iterate } from "../../utils/functions";
import { assertNever } from "../../utils/validate";
import { DropdownMenu, DropdownMenuItem } from "../components/dropdown_menu";
import { Username } from "../components/username";
import { useAction, useEmptyAction } from "../services/game";
import {
  useActiveGameState,
  useInject,
  useInjected,
} from "../utils/injection_context";
import { ManualGoodsGrowth } from "./india-steam-brothers/goods_growth";

const PASS_ACTION = "Pass" as const;
type PassActionString = typeof PASS_ACTION;

const TURN_ORDER_PASS_ACTION = "Turn Order Pass" as const;
type TurnOrderPassActionString = typeof TURN_ORDER_PASS_ACTION;

export function ActionSummary() {
  const currentPhase = useActiveGameState(PHASE);
  switch (currentPhase) {
    case Phase.SHARES:
      return <TakeShares />;
    case Phase.TURN_ORDER:
      return <Bid />;
    case Phase.ACTION_SELECTION:
      return <SpecialActionSelector />;
    case Phase.BUILDING:
      return <Build />;
    case Phase.MOVING:
      return <MoveGoods />;
    case Phase.END_GAME:
      return <EndGame />;
    case Phase.DEURBANIZATION:
      return <Deurbanization />;
    case Phase.MANUAL_GOODS_GROWTH:
      return <ManualGoodsGrowth />;
    case Phase.DISCO_INFERNO_PRODUCTION:
      return <DiscoProduction />;
    case Phase.GOODS_GROWTH:
    case Phase.INCOME:
    case Phase.EXPENSES:
    case Phase.INCOME_REDUCTION:
    case undefined:
      return <></>;
    default:
      assertNever(currentPhase);
  }
}

export function DiscoProduction() {
  return <div>You must disco production.</div>;
}

export function SpecialActionSelector() {
  const { canEmit, canEmitUserId } = useAction(ActionSelectionSelectAction);
  const {
    canEmit: canEmitSkip,
    isPending,
    emit: emitSkip,
  } = useEmptyAction(SkipAction);

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must select a special action.
      </GenericMessage>
    );
  }
  return (
    <GenericMessage>
      You must select a special action.
      {canEmitSkip && (
        <Button disabled={isPending} onClick={emitSkip}>
          Skip
        </Button>
      )}
    </GenericMessage>
  );
}

export function EndGame() {
  return <GenericMessage>This game is over.</GenericMessage>;
}

export function MoveGoods() {
  const {
    emit: emitLoco,
    canEmit,
    canEmitUserId,
    getErrorMessage,
  } = useEmptyAction(LocoAction);
  const { emit: emitPass } = useEmptyAction(MovePassAction);

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must move a good.
      </GenericMessage>
    );
  }

  const locoDisabledReason = getErrorMessage();
  const locoButton = (
    <Button onClick={emitLoco} disabled={locoDisabledReason != null}>
      Locomotive
    </Button>
  );

  return (
    <div>
      <GenericMessage>You must move a good.</GenericMessage>
      {locoDisabledReason != null && (
        <Tooltip title={locoDisabledReason} placement="bottom">
          <span>{locoButton}</span>
        </Tooltip>
      )}
      {locoDisabledReason == null && locoButton}
      <Button onClick={emitPass}>Pass</Button>
    </div>
  );
}

function numberFormat(num: number): string {
  return `${num}`;
}

function dollarFormat(num: number | string): string {
  if (typeof num === "string") return num;
  if (num < 0) {
    return `-$${-num}`;
  }
  return `$${num}`;
}

export function Bid() {
  const {
    emit: emitBid,
    canEmit,
    canEmitUserId,
    isPending: isBidPending,
  } = useAction(BidAction);
  const { emit: emitTurnOrderPass, isPending: isTurnOrderPending } =
    useEmptyAction(TurnOrderPassAction);
  const { emit: emitPass, isPending: isPassPending } =
    useEmptyAction(PassAction);
  const helper = useInjected(TurnOrderHelper);

  const isPending = isBidPending || isTurnOrderPending || isPassPending;

  const placeBid = useCallback(
    (bid: number | PassActionString | TurnOrderPassActionString) => {
      if (bid === PASS_ACTION) {
        emitPass();
      } else if (bid === TURN_ORDER_PASS_ACTION) {
        emitTurnOrderPass();
      } else {
        emitBid({ bid });
      }
    },
    [emitBid, emitPass, emitTurnOrderPass],
  );

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must bid.
      </GenericMessage>
    );
  }

  const minBid = helper.getMinBid();
  const maxBid = helper.getMaxBid();
  const bids: Array<number | PassActionString | TurnOrderPassActionString> = [
    ...(helper.canUseTurnOrderPass() ? [TURN_ORDER_PASS_ACTION] : []),
    PASS_ACTION,
    ...iterate(maxBid - minBid + 1, (i) => i + minBid),
  ];

  return (
    <div>
      <p>You must bid.</p>
      <DropdownMenu id="bid" title="Place bid" disabled={isPending}>
        {bids.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => placeBid(option)}
            disabled={isPending}
          >
            {dollarFormat(option)}
          </DropdownMenuItem>
        ))}
      </DropdownMenu>
    </div>
  );
}

export function GenericMessage({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function TakeShares() {
  const { canEmit, canEmitUserId, emit, isPending } =
    useAction(TakeSharesAction);
  const numShares = useInjected(ShareHelper).getSharesTheyCanTake();
  const options = iterate(numShares + 1, (i) => i);

  const chooseValue = useCallback(
    (numShares: number) => emit({ numShares }),
    [emit],
  );

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must take out shares.
      </GenericMessage>
    );
  }

  return (
    <div>
      <p>Choose how many shares you would like to take out.</p>
      <DropdownMenu id="shares" title="Choose shares" disabled={isPending}>
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => chooseValue(option)}
            disabled={isPending}
          >
            {numberFormat(option)}
          </DropdownMenuItem>
        ))}
      </DropdownMenu>
    </div>
  );
}

export function Deurbanization() {
  const {
    emit: emitPass,
    canEmit,
    isPending,
    canEmitUserId,
  } = useEmptyAction(DeurbanizationPassAction);

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must select a good to deurbanize.
      </GenericMessage>
    );
  }

  return (
    <div>
      You must select a good to deurbanize.
      <Button onClick={emitPass} disabled={isPending}>
        Skip
      </Button>
    </div>
  );
}

export function Build() {
  const { emit: emitPass, canEmit, canEmitUserId } = useEmptyAction(DoneAction);
  const [buildsRemaining, canUrbanize] = useInject(() => {
    const helper = inject(BuilderHelper);
    if (!canEmit) return [undefined, undefined];
    return [helper.buildsRemaining(), helper.canUrbanize()];
  }, [canEmit]);

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> must build.
      </GenericMessage>
    );
  }

  return (
    <div>
      You can build {buildsRemaining} more track{canUrbanize && " and urbanize"}
      .<Button onClick={emitPass}>Done Building</Button>
    </div>
  );
}
