import * as React from "react";
import { Button, Header, Icon, Modal, ModalContent } from "semantic-ui-react";
import { SpecialActionSelector } from "../../client/game/action_summary";
import { useAction } from "../../client/services/action";
import { useUndoAction } from "../../client/services/game";
import { useInject, useInjected } from "../../client/utils/injection_context";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { ActionNamingProvider } from "../../engine/state/action";
import {
  wyomingDisableActionCost,
  WyomingDisableAction,
} from "./action_selection";

export function WyomingActionSelectorSummary() {
  return (
    <>
      <SpecialActionSelector />
      <DisableActionModal />
    </>
  );
}

function DisableActionModal() {
  const { emit, canEmit, isPending } = useAction(WyomingDisableAction);
  const allowedActions = useInjected(AllowedActions);
  const actionNamingProvider = useInjected(ActionNamingProvider);
  const playerCount = useInject(() => injectInitialPlayerCount()(), []);
  const { undo, canUndo, isPending: isUndoPending } = useUndoAction();

  if (!canEmit) {
    return <></>;
  }

  return (
    <Modal open={true}>
      <Header>Disable a Second Action</Header>
      <ModalContent>
        <p>
          As the first player to select an action this round, you may spend
          additional money to disable one more action for everyone (including
          yourself) for the rest of the round.
        </p>
        {[...allowedActions.getAvailableActions()].map((action) => (
          <p key={action}>
            <Button disabled={isPending} onClick={() => emit({ action })}>
              {actionNamingProvider.getActionString(action)} ($
              {wyomingDisableActionCost(action, playerCount)})
            </Button>
          </p>
        ))}
        <p>
          <Button negative disabled={isPending} onClick={() => emit({})}>
            Don&apos;t disable an action
          </Button>
        </p>
        {canUndo && (
          <p>
            <Button
              icon
              labelPosition="left"
              basic
              disabled={isUndoPending}
              onClick={undo}
            >
              <Icon name="undo" />
              Undo action selection
            </Button>
          </p>
        )}
      </ModalContent>
    </Modal>
  );
}
