
import { Box, Button, Checkbox, FormControl, FormControlLabel, FormHelperText, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { FormEvent, useCallback, useMemo } from "react";
import { ReleaseStage, releaseStageToString } from "../../engine/game/map_settings";
import { MapRegistry } from "../../maps";
import { environment, Stage } from "../services/environment";
import { useCreateGame } from "../services/game";
import { useCheckboxState, useSelectState, useTextInputState } from "../utils/form_state";

export function CreateGamePage() {
  const maps = useMemo(() =>
    [...MapRegistry.singleton.values()]
      .filter((map) => map.stage !== ReleaseStage.DEPRECATED)
      .filter((map) => environment.stage === 'development' || map.stage !== ReleaseStage.DEVELOPMENT)
    , []);
  const [name, setName] = useTextInputState('');
  const [gameKey, setGameKey] = useSelectState(maps[0].key);
  const [artificialStart, setArtificialStart] = useCheckboxState();
  const { createGame, validationError, isPending } = useCreateGame();

  const onSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createGame({ name, gameKey, artificialStart });
  }, [name, gameKey, artificialStart, createGame]);

  return <Box
    component="form"
    sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}
    noValidate
    autoComplete="off"
    onSubmit={onSubmit}
  >
    <h1>Create a new Game</h1>
    <FormControl>
      <TextField
        required
        label="Name"
        value={name}
        disabled={isPending}
        error={validationError?.name != null}
        helperText={validationError?.name}
        onChange={setName}
      />
    </FormControl>
    <FormControl sx={{ m: 1, minWidth: 80 }} error={validationError?.gameKey != null}>
      <InputLabel>Map</InputLabel>
      <Select
        required
        value={gameKey}
        disabled={isPending}
        onChange={setGameKey}
        error={validationError?.gameKey != null}
        autoWidth
        label="Map"
      >
        {maps.map((m) => <MenuItem key={m.key} value={m.key}>
          {m.name}
          {m.stage !== ReleaseStage.PRODUCTION && ` (${releaseStageToString(m.stage)})`}
        </MenuItem>)}
      </Select>
      {validationError?.gameKey && <FormHelperText>{validationError?.gameKey}</FormHelperText>}
    </FormControl>
    {environment.stage == Stage.enum.development && <FormControl error={validationError?.artificialStart != null}>
      <FormControlLabel sx={{ m: 1, minWidth: 80 }}
        label="Artificial Start"
        control={
          <Checkbox
            value={artificialStart}
            disabled={isPending}
            onChange={setArtificialStart}
          />}
      />
      <FormHelperText>{validationError?.artificialStart}</FormHelperText>
    </FormControl>}
    <div>
      <Button type="submit" disabled={isPending}>Create</Button>
    </div>
  </Box>;
}