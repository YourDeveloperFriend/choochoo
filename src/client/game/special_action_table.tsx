import { Tooltip } from "@mui/material";
import { useCallback } from "react";
import { GameStatus } from "../../api/game";
import { injectPlayerAction } from "../../engine/game/state";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { SelectAction as ActionSelectionSelectAction } from "../../engine/select_action/select";
import { Action, getSelectedActionString } from "../../engine/state/action";
import { MadagascarAllowedActions } from "../../maps/madagascar/allowed_actions";
import { MadagascarMapSettings } from "../../maps/madagascar/settings";
import { assertNever } from "../../utils/validate";
import { Username } from "../components/username";
import { useAction, useGame } from "../services/game";
import { useInject, useInjected } from "../utils/injection_context";
import { PlayerCircle } from "./bidding_info";
import * as styles from './special_action_table.module.css';
import {MapRegistry} from "../../maps";
import {MapSettings} from "../../engine/game/map_settings";


export function SpecialActionTable() {
  const actions = useInjected(AllowedActions);

  return <div>
    <h2>Special Actions</h2>
    <div className={styles.specialActionTable}>
      {actions.getActions().map((action) => <SpecialAction key={action} action={action} />)}
    </div>
  </div>;
}

function SpecialAction({ action }: { action: Action }) {
  const game = useGame();
  const { gameKey } = game;
  const mapSettings = MapRegistry.singleton.get(gameKey);
  const { emit, canEmit, isPending } = useAction(ActionSelectionSelectAction);
  const allowed = useInjected(AllowedActions);
  const player = useInject(() => injectPlayerAction(action)(), [action]);

  const isClickable = canEmit && player == null && !isPending;
  const disabledReason = game.status === GameStatus.enum.ACTIVE ? allowed.getDisabledActionReason(action) : undefined;
  const isEmittable = isClickable && disabledReason == null;

  const chooseAction = useCallback(() => isEmittable && emit({ action }), [emit, isEmittable, action]);

  const className = [
    styles.specialAction,
    isClickable ? styles.clickable : '',
  ].join(' ');

  const caption = player != null ? <Username userId={player.playerId} /> :
    gameKey === MadagascarMapSettings.key && (allowed as MadagascarAllowedActions).getLastDisabledAction() === action ? 'Stack' :
      undefined;

  const render = <div className={className} onClick={chooseAction}>
    <div className={styles.name}>{getSelectedActionString(action)}</div>
    <div className={styles.description}>{getSelectedActionDescription(action, mapSettings)}</div>
    <div><PlayerCircle disabled={disabledReason != null} color={player?.color} caption={caption} /></div>
  </div>;

  if (disabledReason != null) {
    return <Tooltip title={disabledReason} placement="bottom">{render}</Tooltip>;
  } else {
    return render;
  }
}

function getSelectedActionDescription(action: Action, mapSettings: MapSettings): string {
  if (mapSettings.getActionDescription) {
    let description = mapSettings.getActionDescription(action);
    if (description) {
      return description;
    }
  }

  switch (action) {
    case Action.ENGINEER:
      if (gameKey === GermanyMapSettings.key) {
        return 'Build one tile (the most expensive one) at half price (rounded down).';
      }
      return 'Build an additional track during the Building step.';
    case Action.FIRST_BUILD:
      return 'Go first during the Building step.';
    case Action.FIRST_MOVE:
      return 'Go first during the Move Goods step.';
    case Action.LOCOMOTIVE:
      return 'Immediately, increase your locomotive by one.';
    case Action.PRODUCTION:
      return 'Before the Goods Growth step, draw two cubes and place them on the Goods Growth chart';
    case Action.TURN_ORDER_PASS:
      return 'Next auction, pass without dropping out of the bidding.';
    case Action.URBANIZATION:
      return 'Place a new city on any town during the build step.';
    case Action.REPOPULATION:
      return 'Immediately, draw three cubes from the bag and place one on any station.'
    case Action.DEURBANIZATION:
      return 'Before the Move Goods step, remove a goods cube of your choice from the map.';
    case Action.WTE_PLANT_OPERATOR:
      return 'After the Move Goods step, take all black cubes from the WTE Plant space. Each cube is worth 2 points.';

    case Action.LAST_BUILD: return 'Go last during the Building step.';
    case Action.LAST_MOVE: return 'Go last during the Moving step.';
    case Action.SLOW_ENGINEER: return 'Build one less track during the Building step.';
    case Action.LAST_PLAYER: return 'Next auction, you must pass when it is your turn.';
    case Action.HIGH_COSTS: return 'Each tile you build this turn costs an additional $4.';
    case Action.ONE_MOVE: return 'Skip one of your move goods actions.';
    default:
      assertNever(action);
  }
}
