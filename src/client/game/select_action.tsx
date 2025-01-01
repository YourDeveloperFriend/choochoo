import { Button } from "@mui/material";
import { useCallback } from "react";
import { DoneAction } from "../../engine/build/done";
import { BuilderHelper } from "../../engine/build/helper";
import { inject } from "../../engine/framework/execution_context";
import { PHASE } from "../../engine/game/phase";
import { LocoAction } from "../../engine/move/loco";
import { MovePassAction } from "../../engine/move/pass";
import { MOVE_STATE } from "../../engine/move/state";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { SelectAction as ActionSelectionSelectAction } from "../../engine/select_action/select";
import { ShareHelper } from "../../engine/shares/share_helper";
import { TakeSharesAction } from "../../engine/shares/take_shares";
import { Action, getSelectedActionString } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { BidAction } from "../../engine/turn_order/bid";
import { TurnOrderHelper } from "../../engine/turn_order/helper";
import { PassAction } from "../../engine/turn_order/pass";
import { TurnOrderPassAction } from "../../engine/turn_order/turn_order_pass";
import { PassAction as DeurbanizationPassAction } from "../../maps/ireland/deurbanization";
import { iterate } from "../../utils/functions";
import { assertNever } from "../../utils/validate";
import { DropdownMenu, DropdownMenuItem } from "../components/dropdown_menu";
import { useAction, useEmptyAction } from "../services/game";
import { useActiveGameState, useCurrentPlayer, useInject, useInjected, usePhaseState } from "../utils/injection_context";


const PASS_ACTION = 'Pass' as const;
type PassActionString = typeof PASS_ACTION;

const TURN_ORDER_PASS_ACTION = 'Turn Order Pass' as const;
type TurnOrderPassActionString = typeof TURN_ORDER_PASS_ACTION;

export function SelectAction() {
  const currentPhase = useActiveGameState(PHASE);
  switch (currentPhase) {
    case Phase.SHARES: return <TakeShares />;
    case Phase.TURN_ORDER: return <Bid />;
    case Phase.ACTION_SELECTION: return <SpecialActionSelector />
    case Phase.BUILDING: return <Build />;
    case Phase.MOVING: return <MoveGoods />;
    case Phase.END_GAME:
      return <EndGame />
    case Phase.DEURBANIZATION:
      return <Deurbanization />;
    case Phase.GOODS_GROWTH:
    case Phase.INCOME:
    case Phase.EXPENSES:
    case Phase.INCOME_REDUCTION:
    case undefined:
      return <></>
    default:
      assertNever(currentPhase);
  }
}

export function EndGame() {
  return <GenericMessage>This game is over.</GenericMessage>;
}

export function MoveGoods() {
  const { emit: emitLoco, canEmit, canEmitUsername } = useEmptyAction(LocoAction);
  const { emit: emitPass } = useEmptyAction(MovePassAction);
  const player = useCurrentPlayer();
  const state = usePhaseState(Phase.MOVING, MOVE_STATE);

  if (canEmitUsername == null) {
    return <></>;
  }

  if (!canEmit) {
    return <GenericMessage>{canEmitUsername} must move a good.</GenericMessage>;
  }

  return <div>
    {!state!.locomotive.includes(player!.color) && <Button onClick={emitLoco}>Locomotive</Button>}
    <Button onClick={emitPass}>Pass</Button>
  </div>
}

export function SpecialActionSelector() {
  const { emit, canEmit, canEmitUsername, isPending } = useAction(ActionSelectionSelectAction);
  const actions = useInjected(AllowedActions);

  const chooseAction = useCallback((action: Action) => emit({ action }), [emit]);

  if (canEmitUsername == null) {
    return <></>;
  }

  if (!canEmit) {
    return <GenericMessage>{canEmitUsername} must select an action.</GenericMessage>;
  }

  return <div>
    <p>You must select an action.</p>
    <DropdownMenu title='Select action' disabled={isPending}>
      {actions.getAvailableActions().map(option =>
        <DropdownMenuItem key={option} onClick={() => chooseAction(option)} disabled={isPending}>
          {getSelectedActionString(option)}
        </DropdownMenuItem>)}
    </DropdownMenu>
  </div>;
}

function numberFormat(num: number): string {
  return `${num}`;
}

function dollarFormat(num: number | string): string {
  if (typeof num === 'string') return num;
  if (num < 0) {
    return `-$${-num}`;
  }
  return `$${num}`;
}

export function Bid() {
  const { emit: emitBid, canEmit, canEmitUsername, isPending: isBidPending } = useAction(BidAction);
  const { emit: emitTurnOrderPass, isPending: isTurnOrderPending } = useEmptyAction(TurnOrderPassAction);
  const { emit: emitPass, isPending: isPassPending } = useEmptyAction(PassAction);
  const helper = useInjected(TurnOrderHelper);

  const isPending = isBidPending || isTurnOrderPending || isPassPending;

  const placeBid = useCallback((bid: number | PassActionString | TurnOrderPassActionString) => {
    if (bid === PASS_ACTION) {
      emitPass();
    } else if (bid === TURN_ORDER_PASS_ACTION) {
      emitTurnOrderPass();
    } else {
      emitBid({ bid });
    }
  }, [emitBid, emitPass, emitTurnOrderPass]);

  if (canEmitUsername == null) {
    return <></>;
  }

  if (!canEmit) {
    return <GenericMessage>{canEmitUsername} must bid.</GenericMessage>;
  }


  const minBid = helper.getMinBid();
  const maxBid = helper.getMaxBid();
  const bids: Array<number | PassActionString | TurnOrderPassActionString> = [
    ...(helper.canUseTurnOrderPass() ? [TURN_ORDER_PASS_ACTION] : []),
    PASS_ACTION,
    ...iterate(maxBid - minBid + 1, (i) => i + minBid),
  ];

  return <div>
    <p>You must bid.</p>
    <DropdownMenu title='Place bid' disabled={isPending}>
      {bids.map(option =>
        <DropdownMenuItem key={option} onClick={() => placeBid(option)} disabled={isPending}>
          {dollarFormat(option)}
        </DropdownMenuItem>)}
    </DropdownMenu>
  </div >;
}

export function GenericMessage({ children }: { children: string | string[] }) {
  return <div>{children}</div>
}

export function TakeShares() {
  const { canEmit, canEmitUsername, emit, isPending } = useAction(TakeSharesAction);
  const numShares = useInjected(ShareHelper).getSharesTheyCanTake();
  const options = iterate(numShares, (i) => i);

  const chooseValue = useCallback((numShares: number) => emit({ numShares }), [emit]);

  if (canEmitUsername == null) {
    return <></>;
  }

  if (!canEmit) {
    return <GenericMessage>{canEmitUsername} must take out shares.</GenericMessage>;
  }

  return <div>
    <p>Choose how many shares you would like to take out.</p>
    <DropdownMenu title='Choose shares' disabled={isPending}>
      {options.map(option =>
        <DropdownMenuItem key={option} onClick={() => chooseValue(option)} disabled={isPending}>
          {numberFormat(option)}
        </DropdownMenuItem>)}
    </DropdownMenu>
  </div>;
}

export function Deurbanization() {
  const { emit: emitPass, canEmit, isPending, canEmitUsername } = useEmptyAction(DeurbanizationPassAction);

  if (canEmitUsername == null) {
    return <></>;
  }

  if (!canEmit) {
    return <GenericMessage>{canEmitUsername} must select a good to deurbanize.</GenericMessage>;
  }

  return <div>
    You must select a good to deurbanize.
    <Button onClick={emitPass} disabled={isPending}>Skip</Button>
  </div>;
}

export function Build() {
  const { emit: emitPass, canEmit, canEmitUsername } = useEmptyAction(DoneAction);
  const [buildsRemaining, canUrbanize] = useInject(() => {
    const helper = inject(BuilderHelper);
    if (!canEmit) return [undefined, undefined];
    return [helper.buildsRemaining(), helper.canUrbanize()];
  }, [canEmit]);

  if (canEmitUsername == null) {
    return <></>;
  }

  if (!canEmit) {
    return <GenericMessage>{canEmitUsername} must build.</GenericMessage>;
  }

  return <div>
    You can build {buildsRemaining} more track{canUrbanize && ' and urbanize'}.
    <Button onClick={emitPass}>Done Building</Button>
  </div>;
}