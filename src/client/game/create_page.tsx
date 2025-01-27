import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import { FormEvent, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GameKey } from "../../api/game_key";
import { UserRole } from "../../api/user";
import { VariantConfig } from "../../api/variant_config";
import {
  ReleaseStage,
  releaseStageToString,
} from "../../engine/game/map_settings";
import { Grid } from "../../engine/map/grid";
import { ViewRegistry } from "../../maps/view_registry";
import { HexGrid } from "../grid/hex_grid";
import { environment, Stage } from "../services/environment";
import { useCreateGame } from "../services/game";
import { useMe } from "../services/me";
import {
  useCheckboxState,
  useNumberInputState,
  useSelectState,
  useTextInputState,
} from "../utils/form_state";
import { MapInfo } from "./map_info";

export function CreateGamePage() {
  const me = useMe();
  const initialMapValue =
    (useSearchParams()[0].get("map") as GameKey) ?? GameKey.REVERSTEAM;
  const maps = useMemo(
    () =>
      [...ViewRegistry.singleton.values()]
        .filter((map) => map.stage !== ReleaseStage.DEPRECATED)
        .filter(
          (map) =>
            environment.stage === "development" ||
            map.stage !== ReleaseStage.DEVELOPMENT ||
            me?.role === UserRole.enum.ADMIN,
        )
        .sort((a, b) => (a.name < b.name ? -1 : 1)),
    [],
  );
  const [name, setName] = useTextInputState("");
  const [gameKey, _, setGameKeyState] = useSelectState(initialMapValue);

  const map = ViewRegistry.singleton.get(gameKey);
  const allowPlayerSelections = map.minPlayers !== map.maxPlayers;

  const selectedMap = useMemo(() => {
    return ViewRegistry.singleton.get(gameKey);
  }, [gameKey]);

  const [artificialStart, setArtificialStart] = useCheckboxState();
  const [unlisted, setUnlisted] = useCheckboxState();
  const [minPlayersS, setMinPlayers, setMinPlayersRaw] = useNumberInputState(
    selectedMap.minPlayers,
  );
  const [maxPlayersS, setMaxPlayers, setMaxPlayersRaw] = useNumberInputState(
    selectedMap.maxPlayers,
  );
  const { validateGame, createGame, validationError, isPending } =
    useCreateGame();
  const [variant, setVariant] = useState<Partial<VariantConfig>>(
    selectedMap.getInitialVariantConfig?.() ?? { gameKey },
  );

  const minPlayers = allowPlayerSelections ? minPlayersS : map.minPlayers;
  const maxPlayers = allowPlayerSelections ? maxPlayersS : map.maxPlayers;

  const setGameKey = useCallback(
    (e: SelectChangeEvent<GameKey>) => {
      const gameKey = e.target.value as GameKey;
      setGameKeyState(gameKey);
      const map = ViewRegistry.singleton.get(gameKey);
      if (typeof minPlayers === "number") {
        setMinPlayersRaw(Math.max(minPlayers, map.minPlayers));
      }
      if (typeof maxPlayers === "number") {
        setMaxPlayersRaw(Math.min(maxPlayers, map.maxPlayers));
      }
      setVariant(map.getInitialVariantConfig?.() ?? { gameKey });
    },
    [
      setVariant,
      minPlayers,
      maxPlayers,
      setMinPlayersRaw,
      setMaxPlayersRaw,
      setGameKeyState,
    ],
  );

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      createGame({
        name,
        gameKey,
        artificialStart,
        minPlayers,
        maxPlayers,
        unlisted,
        variant: variant as VariantConfig,
      });
    },
    [
      name,
      gameKey,
      allowPlayerSelections,
      artificialStart,
      createGame,
      minPlayers,
      maxPlayers,
    ],
  );

  const validateGameInternal = useCallback(() => {
    validateGame({
      name,
      gameKey,
      artificialStart,
      minPlayers,
      maxPlayers,
      unlisted,
      variant: variant as VariantConfig,
    });
  }, [name, gameKey, artificialStart, minPlayers, maxPlayers, variant]);

  const grid = useMemo(() => {
    if (gameKey == null) return undefined;
    const settings = ViewRegistry.singleton.get(gameKey);
    return Grid.fromData(
      settings,
      settings.startingGrid,
      settings.interCityConnections ?? [],
    );
  }, [gameKey]);

  const Editor = selectedMap.getVariantConfigEditor;

  return (
    <Box
      component="form"
      sx={{ "& .MuiTextField-root": { m: 1, width: "25ch" } }}
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
          onBlur={validateGameInternal}
        />
      </FormControl>
      <FormControl
        sx={{ m: 1, minWidth: 80 }}
        error={validationError?.gameKey != null}
      >
        <InputLabel>Map</InputLabel>
        <Select
          required
          value={gameKey}
          disabled={isPending}
          onChange={setGameKey}
          error={validationError?.gameKey != null}
          autoWidth
          label="Map"
          onBlur={validateGameInternal}
        >
          {maps.map((m) => (
            <MenuItem key={m.key} value={m.key}>
              {m.name}
              {m.stage !== ReleaseStage.PRODUCTION &&
                ` (${releaseStageToString(m.stage)})`}
            </MenuItem>
          ))}
        </Select>
        {validationError?.gameKey && (
          <FormHelperText>{validationError?.gameKey}</FormHelperText>
        )}
      </FormControl>
      <FormControl>
        <TextField
          required
          label={allowPlayerSelections ? "Min Players" : "Num Players"}
          type="number"
          disabled={!allowPlayerSelections}
          value={minPlayers}
          error={validationError?.minPlayers != null}
          helperText={validationError?.minPlayers}
          onChange={setMinPlayers}
          onBlur={validateGameInternal}
        />
      </FormControl>
      {allowPlayerSelections && (
        <FormControl>
          <TextField
            required
            label="Max Players"
            type="number"
            value={maxPlayers}
            error={validationError?.maxPlayers != null}
            helperText={validationError?.maxPlayers}
            onChange={setMaxPlayers}
            onBlur={validateGameInternal}
          />
        </FormControl>
      )}
      {environment.stage == Stage.enum.development && (
        <FormControl error={validationError?.artificialStart != null}>
          <FormControlLabel
            sx={{ m: 1, minWidth: 80 }}
            label="Artificial Start"
            control={
              <Checkbox
                value={artificialStart}
                disabled={isPending}
                onChange={setArtificialStart}
              />
            }
          />
          <FormHelperText>{validationError?.artificialStart}</FormHelperText>
        </FormControl>
      )}
      <FormControl error={validationError?.unlisted != null}>
        <FormControlLabel
          sx={{ m: 1, minWidth: 80 }}
          label="Unlisted Game"
          control={
            <Checkbox
              value={unlisted}
              disabled={isPending}
              onChange={setUnlisted}
            />
          }
        />
        <FormHelperText>{validationError?.unlisted}</FormHelperText>
      </FormControl>
      {Editor && (
        <Editor
          config={variant}
          setConfig={setVariant}
          errors={validationError}
          isPending={isPending}
        />
      )}
      <div>
        <Button type="submit" disabled={isPending}>
          Create
        </Button>
      </div>
      <MapInfo gameKey={gameKey} />
      {grid && (
        <HexGrid
          key={gameKey}
          gameKey={gameKey}
          rotation={selectedMap.rotation}
          grid={grid}
          fullMapVersion={true}
        />
      )}
    </Box>
  );
}
