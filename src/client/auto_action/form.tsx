import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useCallback, useState } from "react";
import { GameStatus } from "../../api/game";
import { inject } from "../../engine/framework/execution_context";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action, getSelectedActionString } from "../../engine/state/action";
import { AutoAction } from "../../engine/state/auto_action";
import { HelpIcon } from "../components/help";
import { useGame } from "../services/game";
import { useMe } from "../services/me";
import {
  useCheckboxState,
  useNumberInputState,
  useSelectState,
} from "../utils/form_state";
import { useInject } from "../utils/injection_context";
import * as styles from "./form.module.css";
import { useAutoAction, useSetAutoAction } from "./hooks";

export function AutoActionForm() {
  const me = useMe();
  const game = useGame();
  const autoAction = useAutoAction(game.id);
  const [expanded, setExpanded] = useState(false);

  if (
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

export function InternalAutoActionForm({
  gameId,
  autoAction,
  expanded,
  setExpanded,
}: InternalAutoActionFormProps) {
  const availableActions = useInject(
    () => inject(AllowedActions).getActions(),
    [],
  );
  const [skipShares, setSkipShares] = useCheckboxState(autoAction.skipShares);
  const [takeSharesNextDefined, setTakeSharesNextDefined] = useCheckboxState(
    autoAction.takeSharesNext != null,
  );
  const [takeSharesNext, setTakeSharesNext] = useNumberInputState(
    autoAction.takeSharesNext ?? "",
  );
  const [takeActionNextDefined, setTakeActionNextDefined] = useCheckboxState(
    autoAction.takeActionNext != null,
  );
  const [takeActionNext, setTakeActionNext] = useSelectState<Action>(
    autoAction.takeActionNext ??
      availableActions[Symbol.iterator]().next().value,
  );
  const [locoNext, setLocoNext] = useCheckboxState(autoAction.locoNext);
  const [bidUntilDefined, setBidUntilDefined] = useCheckboxState(
    autoAction.bidUntil != null,
  );
  const [maxBid, setMaxBid] = useNumberInputState(
    autoAction.bidUntil?.maxBid ?? "",
  );
  const [incrementally, setIncrementally] = useState(
    autoAction.bidUntil?.incrementally ?? false,
  );
  const [thenPass, setThenPass] = useCheckboxState(
    autoAction.bidUntil?.thenPass ?? false,
  );

  const { setAutoAction, isPending, validationError } =
    useSetAutoAction(gameId);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
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

  const handleAccordionChange = useCallback(
    (_: unknown, isExpanded: boolean) => setExpanded(isExpanded),
    [setExpanded],
  );

  const count = [
    skipShares,
    takeSharesNextDefined,
    takeActionNextDefined,
    locoNext,
    bidUntilDefined,
  ].filter((bool) => bool === true).length;

  const handleIncrementallyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIncrementally((event.target as HTMLInputElement).value === "true");
    },
    [setIncrementally],
  );

  return (
    <Accordion expanded={expanded} onChange={handleAccordionChange}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography component="h2">
          Auto Actions {count > 0 && `(${count})`}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          component="form"
          className={styles.form}
          sx={{ "& .MuiTextField-root": { m: 1, width: "25ch" } }}
          noValidate
          autoComplete="off"
          onSubmit={onSubmit}
        >
          <FormControl
            component="div"
            error={validationError?.skipShares != null}
          >
            <FormControlLabel
              sx={{ m: 1, minWidth: 80 }}
              label={
                <>
                  Done taking shares.
                  <HelpIcon>
                    Every time it&apos;s your turn to take out shares,
                    you&apos;ll pass without taking any shares. This will
                    continue until the game ends or you untoggle this button.
                  </HelpIcon>
                </>
              }
              control={
                <Checkbox
                  checked={skipShares}
                  value={skipShares}
                  disabled={isPending}
                  onChange={setSkipShares}
                />
              }
            />
            <FormHelperText>{validationError?.skipShares}</FormHelperText>
          </FormControl>
          <FormControl
            component="div"
            error={validationError?.takeSharesNextDefined != null}
          >
            <FormControlLabel
              sx={{ m: 1, minWidth: 80 }}
              label={
                <>
                  Select how many shares to take out next shares round.
                  <HelpIcon>
                    The next time it&apos;s your turn to take out shares,
                    you&apos;ll take out this many shares. This field gets reset
                    after the action is performed.
                  </HelpIcon>
                </>
              }
              control={
                <Checkbox
                  checked={takeSharesNextDefined}
                  value={takeSharesNextDefined}
                  disabled={isPending}
                  onChange={setTakeSharesNextDefined}
                />
              }
            />
            <FormHelperText>
              {validationError?.takeSharesNextDefined}
            </FormHelperText>
          </FormControl>
          {takeSharesNextDefined && (
            <FormControl component="div" className={styles.tab}>
              <TextField
                label="Number of shares"
                type="number"
                disabled={isPending}
                value={takeSharesNext}
                error={validationError?.takeSharesNext != null}
                helperText={validationError?.takeSharesNext}
                onChange={setTakeSharesNext}
              />
            </FormControl>
          )}
          <FormControl
            component="div"
            error={validationError?.bidUntilDefined != null}
          >
            <FormControlLabel
              sx={{ m: 1, minWidth: 80 }}
              label="Auto-bidding"
              control={
                <Checkbox
                  checked={bidUntilDefined}
                  value={bidUntilDefined}
                  disabled={isPending}
                  onChange={setBidUntilDefined}
                />
              }
            />
            <FormHelperText>{validationError?.bidUntilDefined}</FormHelperText>
          </FormControl>
          {bidUntilDefined && (
            <FormControl component="div" className={styles.tab}>
              <TextField
                label="Max bid"
                type="number"
                disabled={isPending}
                value={maxBid}
                error={validationError?.["bidUntil.maxBid"] != null}
                helperText={validationError?.["bidUntil.maxBid"]}
                onChange={setMaxBid}
              />
            </FormControl>
          )}
          {bidUntilDefined && (
            <FormControl
              component="div"
              className={styles.tab2}
              error={validationError?.incrementally != null}
            >
              <RadioGroup
                value={incrementally}
                name="radio-buttons-incrementally"
                onChange={handleIncrementallyChange}
              >
                <FormControlLabel
                  value={true}
                  control={<Radio />}
                  disabled={isPending}
                  label="Incrementally +1 previous bid until max bid is reached"
                />
                <FormControlLabel
                  value={false}
                  control={<Radio />}
                  disabled={isPending}
                  label="Jump right to max bid"
                />
              </RadioGroup>
            </FormControl>
          )}
          {bidUntilDefined && (
            <FormControl
              component="div"
              className={styles.tab}
              error={validationError?.["bidUntil.thenPass"] != null}
            >
              <FormControlLabel
                sx={{ m: 1, minWidth: 80 }}
                label={
                  <>
                    Pass once max bid is exceeded
                    <HelpIcon>
                      The next time it&apos;s your turn to bid and the bid is
                      greater than your max, you&apos;ll pass instead. Leave
                      blank if you want to bid until the max bid, then decide
                      what to do.
                    </HelpIcon>
                  </>
                }
                control={
                  <Checkbox
                    checked={thenPass}
                    value={thenPass}
                    disabled={isPending}
                    onChange={setThenPass}
                  />
                }
              />
              <FormHelperText>
                {validationError?.["bidUntil.thenPass"]}
              </FormHelperText>
            </FormControl>
          )}
          <FormControl
            component="div"
            error={validationError?.takeActionNextDefined != null}
          >
            <FormControlLabel
              sx={{ m: 1, minWidth: 80 }}
              label={
                <>
                  Select an action (if available).
                  <HelpIcon>
                    The next time it&apos;s your turn to select an action,
                    it&apos;ll select this action if it&apos;s available.
                    Otherwise, it&apos;ll just wait for you to select an action.
                    Resets after an action is selected.
                  </HelpIcon>
                </>
              }
              control={
                <Checkbox
                  checked={takeActionNextDefined}
                  value={takeActionNextDefined}
                  disabled={isPending}
                  onChange={setTakeActionNextDefined}
                />
              }
            />
            <FormHelperText>
              {validationError?.takeActionNextDefined}
            </FormHelperText>
          </FormControl>
          {takeActionNextDefined && (
            <FormControl
              component="div"
              className={styles.tab}
              error={validationError?.gameKey != null}
            >
              <InputLabel>Selected Action</InputLabel>
              <Select
                required
                value={takeActionNext}
                disabled={isPending}
                onChange={setTakeActionNext}
                error={validationError?.takeActionNext != null}
                autoWidth
                label="Selected Action"
              >
                {[...availableActions].map((action) => (
                  <MenuItem key={action} value={action}>
                    {getSelectedActionString(action)}
                  </MenuItem>
                ))}
              </Select>
              {validationError?.takeActionNext && (
                <FormHelperText>
                  {validationError?.takeActionNext}
                </FormHelperText>
              )}
            </FormControl>
          )}
          <FormControl
            component="div"
            error={validationError?.locoNext != null}
          >
            <FormControlLabel
              sx={{ m: 1, minWidth: 80 }}
              label="Loco as your next Move Goods action"
              control={
                <Checkbox
                  checked={locoNext}
                  value={locoNext}
                  disabled={isPending}
                  onChange={setLocoNext}
                />
              }
            />
            <FormHelperText>{validationError?.locoNext}</FormHelperText>
          </FormControl>
          <div>
            <Button type="submit" disabled={isPending}>
              Submit
            </Button>
          </div>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
