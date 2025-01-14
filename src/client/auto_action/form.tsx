import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Checkbox, FormControl, FormControlLabel, FormHelperText, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { FormEvent, useCallback, useState } from "react";
import { GameStatus } from "../../api/game";
import { inject } from "../../engine/framework/execution_context";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action, getSelectedActionString } from "../../engine/state/action";
import { AutoAction } from "../../engine/state/auto_action";
import { useGame } from "../services/game";
import { useMe } from "../services/me";
import { useCheckboxState, useNumberInputState, useSelectState } from "../utils/form_state";
import { useInject } from "../utils/injection_context";
import * as styles from './form.module.css';
import { useAutoAction, useSetAutoAction } from "./hooks";

export function AutoActionForm() {
  const me = useMe();
  const game = useGame();
  const autoAction = useAutoAction(game.id);
  const [expanded, setExpanded] = useState(false);

  if (me == null || game.status !== GameStatus.enum.ACTIVE || !game.playerIds.includes(me.id)) return <></>;

  return <InternalAutoActionForm key={`${me?.id}-${game.id}-${game.version}`} gameId={game.id} autoAction={autoAction} expanded={expanded} setExpanded={setExpanded} />;
}

interface InternalAutoActionFormProps {
  gameId: number;
  autoAction: AutoAction;
  expanded: boolean;
  setExpanded(expanded: boolean): void;
}

export function InternalAutoActionForm({ gameId, autoAction, expanded, setExpanded }: InternalAutoActionFormProps) {
  const availableActions = useInject(() => inject(AllowedActions).getActions(), []);
  const [skipShares, setSkipShares] = useCheckboxState(autoAction.skipShares);
  const [takeSharesNextDefined, setTakeSharesNextDefined] = useCheckboxState(autoAction.takeSharesNext != null);
  const [takeSharesNext, setTakeSharesNext] = useNumberInputState(autoAction.takeSharesNext ?? '');
  const [takeActionNextDefined, setTakeActionNextDefined] = useCheckboxState(autoAction.takeActionNext != null);
  const [takeActionNext, setTakeActionNext] = useSelectState<Action>(autoAction.takeActionNext ?? availableActions[Symbol.iterator]().next().value);
  const [locoNext, setLocoNext] = useCheckboxState(autoAction.locoNext);
  const [bidUntilDefined, setBidUntilDefined] = useCheckboxState(autoAction.bidUntil != null);
  const [maxBid, setMaxBid] = useNumberInputState(autoAction.bidUntil?.maxBid ?? '');
  const [incrementally, setIncrementally] = useCheckboxState(autoAction.bidUntil?.incrementally ?? false);
  const [thenPass, setThenPass] = useCheckboxState(autoAction.bidUntil?.thenPass ?? false);

  const { setAutoAction, isPending, validationError } = useSetAutoAction(gameId);

  const onSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAutoAction({
      skipShares,
      takeSharesNext: takeSharesNextDefined ? takeSharesNext : undefined,
      takeActionNext: takeActionNextDefined ? takeActionNext : undefined,
      locoNext,
      bidUntil: bidUntilDefined ? {
        maxBid,
        incrementally,
        thenPass,
      } : undefined,
    });
  }, [setAutoAction, skipShares, takeSharesNextDefined, takeSharesNext, takeActionNextDefined, takeActionNext, locoNext, bidUntilDefined, maxBid, incrementally, thenPass]);

  const handleAccordionChange = useCallback((_: unknown, isExpanded: boolean) => setExpanded(isExpanded), [setExpanded]);

  const count = [skipShares, takeSharesNextDefined, takeActionNextDefined, locoNext, bidUntilDefined]
    .filter((bool) => bool === true).length;

  return <Accordion expanded={expanded} onChange={handleAccordionChange}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography component="h2">Auto Actions {count > 0 && `(${count})`}</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box
        component="form"
        className={styles.form}
        sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}
        noValidate
        autoComplete="off"
        onSubmit={onSubmit}
      >
        <FormControl component="div" error={validationError?.skipShares != null}>
          <FormControlLabel sx={{ m: 1, minWidth: 80 }}
            label="Skip taking shares the rest of the game."
            control={
              <Checkbox
                checked={skipShares}
                value={skipShares}
                disabled={isPending}
                onChange={setSkipShares}
              />}
          />
          <FormHelperText>{validationError?.skipShares}</FormHelperText>
        </FormControl>
        <FormControl component="div" error={validationError?.takeSharesNextDefined != null}>
          <FormControlLabel sx={{ m: 1, minWidth: 80 }}
            label='Select how many shares to take out next shares round.'
            control={
              <Checkbox
                checked={takeSharesNextDefined}
                value={takeSharesNextDefined}
                disabled={isPending}
                onChange={setTakeSharesNextDefined}
              />}
          />
          <FormHelperText>{validationError?.takeSharesNextDefined}</FormHelperText>
        </FormControl>
        {takeSharesNextDefined && <FormControl component='div' className={styles.tab}>
          <TextField
            label='Number of shares'
            type="number"
            disabled={isPending}
            value={takeSharesNext}
            error={validationError?.takeSharesNext != null}
            helperText={validationError?.takeSharesNext}
            onChange={setTakeSharesNext}
          />
        </FormControl>}
        <FormControl component="div" error={validationError?.bidUntilDefined != null}>
          <FormControlLabel sx={{ m: 1, minWidth: 80 }}
            label='Auto-bidding'
            control={
              <Checkbox
                checked={bidUntilDefined}
                value={bidUntilDefined}
                disabled={isPending}
                onChange={setBidUntilDefined}
              />}
          />
          <FormHelperText>{validationError?.bidUntilDefined}</FormHelperText>
        </FormControl>
        {bidUntilDefined && <FormControl component='div' className={styles.tab} error={validationError?.incrementally != null}>
          <FormControlLabel sx={{ m: 1, minWidth: 80 }}
            label='+1 previous bid until max is reached'
            control={
              <Checkbox
                checked={incrementally}
                value={incrementally}
                disabled={isPending}
                onChange={setIncrementally}
              />}
          />
          <FormHelperText>{validationError?.incrementally}</FormHelperText>
        </FormControl>}
        {bidUntilDefined && <FormControl component='div' className={styles.tab}>
          <TextField
            label={incrementally ? 'Maximum bid' : 'Next bid'}
            type="number"
            disabled={isPending}
            value={maxBid}
            error={validationError?.['bidUntil.maxBid'] != null}
            helperText={validationError?.['bidUntil.maxBid']}
            onChange={setMaxBid}
          />
        </FormControl>}
        {bidUntilDefined && <FormControl component="div" className={styles.tab} error={validationError?.['bidUntil.thenPass'] != null}>
          <FormControlLabel sx={{ m: 1, minWidth: 80 }}
            label='Pass once max bid is reached'
            control={
              <Checkbox
                checked={thenPass}
                value={thenPass}
                disabled={isPending}
                onChange={setThenPass}
              />}
          />
          <FormHelperText>{validationError?.['bidUntil.thenPass']}</FormHelperText>
        </FormControl>}
        <FormControl component="div" error={validationError?.takeActionNextDefined != null}>
          <FormControlLabel sx={{ m: 1, minWidth: 80 }}
            label='Select an action (if available)'
            control={
              <Checkbox
                checked={takeActionNextDefined}
                value={takeActionNextDefined}
                disabled={isPending}
                onChange={setTakeActionNextDefined}
              />}
          />
          <FormHelperText>{validationError?.takeActionNextDefined}</FormHelperText>
        </FormControl>
        {takeActionNextDefined && <FormControl component='div' className={styles.tab} error={validationError?.gameKey != null}>
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
            {[...availableActions].map((action) => <MenuItem key={action} value={action}>
              {getSelectedActionString(action)}
            </MenuItem>)}
          </Select>
          {validationError?.takeActionNext && <FormHelperText>{validationError?.takeActionNext}</FormHelperText>}
        </FormControl>}
        <FormControl component="div" error={validationError?.locoNext != null}>
          <FormControlLabel sx={{ m: 1, minWidth: 80 }}
            label='Loco as your next Move Goods action'
            control={
              <Checkbox
                checked={locoNext}
                value={locoNext}
                disabled={isPending}
                onChange={setLocoNext}
              />}
          />
          <FormHelperText>{validationError?.locoNext}</FormHelperText>
        </FormControl>
        <div>
          <Button type="submit" disabled={isPending}>Submit</Button>
        </div>
      </Box>
    </AccordionDetails>
  </Accordion>;
}