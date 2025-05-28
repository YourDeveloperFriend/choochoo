import { MouseEvent, useCallback, useState } from "react";
import { GameStatus } from "../../api/game";
import { inject } from "../../engine/framework/execution_context";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action, getSelectedActionString } from "../../engine/state/action";
import { AutoAction } from "../../engine/state/auto_action";
import { canEditGame, useGame } from "../services/game";
import { useMe } from "../services/me";
import {
  useNumberInputState,
  useSemanticSelectState,
  useSemanticUiCheckboxState,
} from "../utils/form_state";
import { useInject } from "../utils/injection_context";
import * as styles from "./form.module.css";
import { useAutoAction, useSetAutoAction } from "./hooks";
import {
  Accordion,
  AccordionContent,
  AccordionTitle,
  Form,
  FormCheckbox,
  FormField,
  FormGroup,
  Menu,
  MenuItem,
  Popup,
  Icon,
  Input,
  Button,
  Radio,
  Dropdown,
} from "semantic-ui-react";

export function AutoActionForm() {
  const me = useMe();
  const game = useGame();
  const autoAction = useAutoAction(game.id);
  const [expanded, setExpanded] = useState(false);
  const canEdit = canEditGame(game);

  if (
    !canEdit ||
    me == null ||
    game.status !== GameStatus.enum.ACTIVE ||
    !game.playerIds.includes(me.id)
  )
    return <></>;

  return (
    <InternalAutoActionForm
      key={`${me?.id}-${game.id}-${game.version}`}
      gameId={game.id}
      autoAction={autoAction}
      expanded={expanded}
      setExpanded={setExpanded}
    />
  );
}

interface InternalAutoActionFormProps {
  gameId: number;
  autoAction: AutoAction;
  expanded: boolean;
  setExpanded(expanded: boolean): void;
}

function InternalAutoActionForm({
  gameId,
  autoAction,
  expanded,
  setExpanded,
}: InternalAutoActionFormProps) {
  const availableActions = useInject(
    () => inject(AllowedActions).getActions(),
    [],
  );
  const [skipShares, setSkipShares] = useSemanticUiCheckboxState(
    autoAction.skipShares,
  );
  const [takeSharesNextDefined, setTakeSharesNextDefined] =
    useSemanticUiCheckboxState(autoAction.takeSharesNext != null);
  const [takeSharesNext, setTakeSharesNext] = useNumberInputState(
    autoAction.takeSharesNext ?? "",
  );
  const [takeActionNextDefined, setTakeActionNextDefined] =
    useSemanticUiCheckboxState(autoAction.takeActionNext != null);
  const [takeActionNext, setTakeActionNext] = useSemanticSelectState<Action>(
    autoAction.takeActionNext ??
      availableActions[Symbol.iterator]().next().value,
  );
  const [locoNext, setLocoNext] = useSemanticUiCheckboxState(
    autoAction.locoNext,
  );
  const [bidUntilDefined, setBidUntilDefined] = useSemanticUiCheckboxState(
    autoAction.bidUntil != null,
  );
  const [maxBid, setMaxBid] = useNumberInputState(
    autoAction.bidUntil?.maxBid ?? "",
  );
  const [incrementally, setIncrementally] = useState(
    autoAction.bidUntil?.incrementally ?? false,
  );
  const [thenPass, setThenPass] = useSemanticUiCheckboxState(
    autoAction.bidUntil?.thenPass ?? false,
  );

  const { setAutoAction, isPending, validationError } =
    useSetAutoAction(gameId);

  const onSubmit = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      setAutoAction({
        skipShares,
        takeSharesNext: takeSharesNextDefined ? takeSharesNext : undefined,
        takeActionNext: takeActionNextDefined ? takeActionNext : undefined,
        locoNext,
        bidUntil: bidUntilDefined
          ? {
              maxBid,
              incrementally,
              thenPass,
            }
          : undefined,
      });
    },
    [
      setAutoAction,
      skipShares,
      takeSharesNextDefined,
      takeSharesNext,
      takeActionNextDefined,
      takeActionNext,
      locoNext,
      bidUntilDefined,
      maxBid,
      incrementally,
      thenPass,
    ],
  );

  const count = [
    skipShares,
    takeSharesNextDefined,
    takeActionNextDefined,
    locoNext,
    bidUntilDefined,
  ].filter((bool) => bool === true).length;

  const handleIncrementallyChange = useCallback(
    (val: boolean) => {
      setIncrementally(val);
    },
    [setIncrementally],
  );

  return (
    <Accordion fluid as={Menu} vertical>
      <MenuItem>
        <AccordionTitle
          active={expanded}
          index={0}
          onClick={() => setExpanded(!expanded)}
          content={"Auto Actions" + (count > 0 ? ` (${count})` : "")}
        />
        <AccordionContent active={expanded}>
          <Form>
            <FormCheckbox
              checked={skipShares}
              disabled={isPending}
              onChange={setSkipShares}
              error={validationError?.skipShares}
              label={
                <label>
                  Done taking shares.{" "}
                  <Popup
                    trigger={<Icon circular size="small" name="question" />}
                    content="Every time it's your turn to take out shares,
                      you'll pass without taking any shares. This will
                      continue until the game ends or you untoggle this button."
                  />
                </label>
              }
            />

            <FormCheckbox
              checked={takeSharesNextDefined}
              disabled={isPending}
              onChange={setTakeSharesNextDefined}
              error={validationError?.takeSharesNextDefined}
              label={
                <label>
                  Select how many shares to take out next shares round.{" "}
                  <Popup
                    trigger={<Icon circular size="small" name="question" />}
                    content="The next time it's your turn to take out shares,
                    you'll take out this many shares. This field gets reset
                    after the action is performed."
                  />
                </label>
              }
            />

            {takeSharesNextDefined && (
              <div className={styles.subForm}>
                <FormGroup inline>
                  <FormField
                    label="Number of shares"
                    control={Input}
                    type="number"
                    disabled={isPending}
                    value={takeSharesNext}
                    error={validationError?.takeSharesNext}
                    onChange={setTakeSharesNext}
                  />
                </FormGroup>
              </div>
            )}

            <FormCheckbox
              checked={bidUntilDefined}
              disabled={isPending}
              onChange={setBidUntilDefined}
              error={validationError?.bidUntilDefined}
              label="Auto-bidding"
            />

            {bidUntilDefined && (
              <div className={styles.subForm}>
                <FormGroup inline>
                  <FormField
                    label="Max bid"
                    control={Input}
                    type="number"
                    disabled={isPending}
                    value={maxBid}
                    error={validationError?.["bidUntil.maxBid"]}
                    onChange={setMaxBid}
                  />
                </FormGroup>
                <FormGroup grouped>
                  <FormField>
                    <Radio
                      label="Incrementally +1 previous bid until max bid is reached"
                      checked={incrementally}
                      onChange={() => handleIncrementallyChange(true)}
                      disabled={isPending}
                    />
                  </FormField>
                  <FormField>
                    <Radio
                      label="Jump right to max bid"
                      checked={!incrementally}
                      onChange={() => handleIncrementallyChange(false)}
                      disabled={isPending}
                    />
                  </FormField>
                </FormGroup>
                <FormGroup>
                  <FormCheckbox
                    checked={thenPass}
                    disabled={isPending}
                    onChange={setThenPass}
                    error={validationError?.["bidUntil.thenPass"]}
                    label={
                      <label>
                        Pass once max bid is exceeded{" "}
                        <Popup
                          trigger={
                            <Icon circular size="small" name="question" />
                          }
                          content="The next time it's your turn to bid and the bid is
                          greater than your max, you'll pass instead. Leave
                          blank if you want to bid until the max bid, then decide
                          what to do."
                        />
                      </label>
                    }
                  />
                </FormGroup>
              </div>
            )}

            <FormCheckbox
              checked={takeActionNextDefined}
              disabled={isPending}
              onChange={setTakeActionNextDefined}
              error={validationError?.takeActionNextDefined}
              label={
                <label>
                  Select an action (if available).{" "}
                  <Popup
                    trigger={<Icon circular size="small" name="question" />}
                    content=" The next time it's your turn to select an action,
                      it'll select this action if it's available.
                      Otherwise, it'll just wait for you to select an action.
                      Resets after an action is selected."
                  />
                </label>
              }
            />

            {takeActionNextDefined && (
              <div className={styles.subForm}>
                <FormGroup widths="equal">
                  <FormField error={validationError?.takeActionNext} required>
                    <label>Selected Action</label>
                    <Dropdown
                      fluid
                      selection
                      value={takeActionNext}
                      onChange={setTakeActionNext}
                      disabled={isPending}
                      options={[...availableActions].map((action) => {
                        return {
                          key: action,
                          value: action,
                          text: getSelectedActionString(action),
                        };
                      })}
                    />
                  </FormField>
                </FormGroup>
              </div>
            )}

            <FormCheckbox
              checked={locoNext}
              disabled={isPending}
              onChange={setLocoNext}
              error={validationError?.locoNext}
              label="Loco as your next Move Goods action"
            />

            <Button
              primary
              type="submit"
              disabled={isPending}
              onClick={onSubmit}
            >
              Submit
            </Button>
          </Form>
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}
