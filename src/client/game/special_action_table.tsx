import { useCallback } from "react";
import { GameStatus } from "../../api/game";
import { AVAILABLE_CITIES, injectPlayerAction } from "../../engine/game/state";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { SelectAction as ActionSelectionSelectAction } from "../../engine/select_action/select";
import { Action, ActionNamingProvider } from "../../engine/state/action";
import { ViewRegistry } from "../../maps/view_registry";
import { useConfirm } from "../components/confirm";
import { MaybeTooltip } from "../components/maybe_tooltip";
import { Username } from "../components/username";
import { useAction } from "../services/action";
import { useGame } from "../services/game";
import {
  useInject,
  useInjected,
  useInjectedState,
} from "../utils/injection_context";
import { PlayerCircle } from "./bidding_info";
import * as styles from "./special_action_table.module.css";

export function SpecialActionTable() {
  const actions = useInjected(AllowedActions);

  return (
    <div style={{ marginTop: "1em" }}>
      <h2>Special Actions</h2>
      <div className={styles.specialActionTable}>
        {actions.getActions().map((action) => (
          <SpecialAction key={action} action={action} />
        ))}
      </div>
    </div>
  );
}

function SpecialAction({ action }: { action: Action }) {
  const game = useGame();
  const { gameKey } = game;
  const mapSettings = ViewRegistry.singleton.get(gameKey);
  const { emit, canEmit, isPending } = useAction(ActionSelectionSelectAction);
  const allowed = useInjected(AllowedActions);
  const player = useInject(() => injectPlayerAction(action)(), [action]);
  const actionNamingProvider = useInjected(ActionNamingProvider);
  const availableCities = useInjectedState(AVAILABLE_CITIES);
  const confirm = useConfirm();

  const isClickable = canEmit && player == null && !isPending;
  const disabledReason =
    game.status === GameStatus.enum.ACTIVE
      ? allowed.getDisabledActionReason(action)
      : undefined;
  const isEmittable = isClickable && disabledReason == null;

  const chooseAction = useCallback(() => {
    if (!isEmittable) return;
    if (action === Action.URBANIZATION && availableCities.length === 0) {
      confirm(
        "There are no more available new cities, are you sure you want to select Urbanization?",
      ).then((confirmed) => {
        if (confirmed) emit({ action });
      });
      return;
    }
    emit({ action });
  }, [emit, isEmittable, action, availableCities, confirm]);

  const className = [
    styles.specialAction,
    isClickable ? styles.clickable : "",
  ].join(" ");

  const caption = mapSettings.getActionCaption?.(action);
  const captions =
    caption == null ? [] : Array.isArray(caption) ? caption : [caption];

  return (
    <MaybeTooltip tooltip={disabledReason}>
      {/* Named for the end-to-end specs: the card is a div with a hashed CSS
          module class, so there is otherwise nothing stable to click. */}
      <div
        className={className}
        onClick={chooseAction}
        data-special-action={action}
        data-selectable={isEmittable ? "" : undefined}
      >
        <div className={styles.name}>
          {actionNamingProvider.getActionString(action)}
        </div>
        <div className={styles.description}>
          {actionNamingProvider.getActionDescription(action)}
        </div>
        <div>
          <PlayerCircle
            disabled={disabledReason != null}
            color={player?.color}
            caption={player != null && <Username userId={player.playerId} />}
          />
        </div>
        <div>
          {captions.length > 0 && (
            <ul className={styles.captionList}>
              {captions.map((caption, index) => (
                <li key={index}>({caption})</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </MaybeTooltip>
  );
}
