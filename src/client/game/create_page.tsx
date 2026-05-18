import * as React from "react";
import { FormEvent, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Container,
  Form,
  FormCheckbox,
  FormInput,
  FormSelect,
  Header,
  Segment,
} from "semantic-ui-react";
import {
  allTurnDurations,
  TurnDuration,
  turnDurationToString,
} from "../../api/game";
import { GameKey } from "../../api/game_key";
import { RUST_BELT_GAME_KEY } from "../../maps/rust_belt/settings";
import { UserRole } from "../../api/user";
import { VariantConfig } from "../../api/variant_config";
import {
  ReleaseStage,
  releaseStageToString,
} from "../../engine/game/map_settings";
import { ViewRegistry } from "../../maps/view_registry";
import { log } from "../../utils/functions";
import { environment, Stage } from "../services/environment";
import { useCreateGame } from "../services/game";
import { useIsAdmin, useMe } from "../services/me";
import {
  useNumberInputState,
  useSemanticSelectState,
  useSemanticUiCheckboxState,
  useTextInputState,
} from "../utils/form_state";
import { MapGridPreview, MapInfo } from "./map_info";
import { MapSelectorDialog } from "./map_selector_dialog";

export function CreateGamePage() {
  const me = useMe();
  const initialMapValue =
    (useSearchParams()[0].get("map") as GameKey) ?? RUST_BELT_GAME_KEY;
  const maps = useMemo(
    () =>
      [...ViewRegistry.singleton.values()]
        .filter((map) => map.stage !== ReleaseStage.DEPRECATED)
        .filter(
          (map) =>
            environment.stage === "development" ||
            map.stage !== ReleaseStage.DEVELOPMENT ||
            me?.role === UserRole.enum.ADMIN ||
            (map.developmentAllowlist !== undefined &&
              me !== undefined &&
              map.developmentAllowlist.indexOf(me.id) !== -1),
        )
        .sort((a, b) => (a.name < b.name ? -1 : 1)),
    [],
  );
  const [name, setName] = useTextInputState("");
  const [gameKey, setGameKeyState] = useState(initialMapValue);
  const [turnDuration, setTurnDuration] = useSemanticSelectState(
    TurnDuration.ONE_DAY,
  );
  const [gameHoursStartLocal, setGameHoursStartLocal] =
    useSemanticSelectState(9);
  const [gameHoursEndLocal, setGameHoursEndLocal] = useSemanticSelectState(21);

  const map = ViewRegistry.singleton.get(gameKey);
  const allowPlayerSelections = map.minPlayers !== map.maxPlayers;

  const selectedMap = useMemo(() => {
    return ViewRegistry.singleton.get(gameKey);
  }, [gameKey]);

  const [minKarmaS, setMinKarma] = useNumberInputState(0);
  const [artificialStart, setArtificialStart] = useSemanticUiCheckboxState();
  const [unlisted, setUnlisted] = useSemanticUiCheckboxState();
  const [autoStart, setAutoStart] = useSemanticUiCheckboxState(true);
  const [minPlayersS, setMinPlayers, setMinPlayersRaw] = useNumberInputState(
    selectedMap.minPlayers,
  );
  const [maxPlayersS, setMaxPlayers, setMaxPlayersRaw] = useNumberInputState(
    selectedMap.maxPlayers,
  );
  const { validateGame, createGame, validationError, isPending } =
    useCreateGame();
  const [variant, setVariant] = useState(
    (selectedMap.getInitialVariantConfig?.() ?? {}) as VariantConfig,
  );
  const isAdmin = useIsAdmin();
  const [mapDialogOpen, setMapDialogOpen] = useState(false);

  const minPlayers = allowPlayerSelections ? minPlayersS : map.minPlayers;
  const maxPlayers = allowPlayerSelections ? maxPlayersS : map.maxPlayers;

  const setGameKey = useCallback(
    (gameKey: GameKey) => {
      setGameKeyState(gameKey);
      const map = ViewRegistry.singleton.get(gameKey);
      if (typeof minPlayers === "number") {
        setMinPlayersRaw(Math.max(minPlayers, map.minPlayers));
      }
      if (typeof maxPlayers === "number") {
        setMaxPlayersRaw(Math.min(maxPlayers, map.maxPlayers));
      }
      setVariant((map.getInitialVariantConfig?.() ?? {}) as VariantConfig);
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

  const localToUtcHour = (localHour: number) => {
    const offset = Math.round(new Date().getTimezoneOffset() / 60);
    return (((localHour + offset) % 24) + 24) % 24;
  };

  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const allLocalHours = Array.from({ length: 24 }, (_, h) => {
    const d = new Date();
    d.setHours(h, 0, 0, 0);
    return {
      key: h,
      value: h,
      text: d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
  });

  const gameHoursDuration =
    ((gameHoursEndLocal as number) - (gameHoursStartLocal as number) + 24) %
      24 || 24;

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      createGame({
        name,
        gameKey,
        artificialStart,
        turnDuration,
        gameHoursStart: localToUtcHour(gameHoursStartLocal as number),
        gameHoursDuration,
        minPlayers,
        maxPlayers,
        unlisted,
        autoStart,
        minKarma: minKarmaS,
        variant: variant as VariantConfig,
      });
    },
    [
      name,
      gameKey,
      allowPlayerSelections,
      artificialStart,
      unlisted,
      autoStart,
      createGame,
      minPlayers,
      maxPlayers,
      minKarmaS,
      turnDuration,
      gameHoursStartLocal,
      gameHoursEndLocal,
      variant,
    ],
  );

  const validateGameInternal = useCallback(() => {
    validateGame({
      name,
      gameKey,
      artificialStart,
      minPlayers,
      maxPlayers,
      turnDuration,
      gameHoursStart: localToUtcHour(gameHoursStartLocal as number),
      gameHoursDuration,
      unlisted,
      autoStart,
      minKarma: minKarmaS,
      variant: variant as VariantConfig,
    });
  }, [
    name,
    gameKey,
    artificialStart,
    minPlayers,
    maxPlayers,
    variant,
    unlisted,
    autoStart,
    minKarmaS,
    turnDuration,
    gameHoursStartLocal,
    gameHoursEndLocal,
  ]);

  const Editor = selectedMap.getVariantConfigEditor;

  if (validationError != null) {
    log("validation", validationError);
  }

  return (
    <Container>
      <Header as="h1">Create a new Game</Header>

      <Segment>
        <Form>
          <FormInput
            required
            label="Name"
            name="name"
            data-name-input
            value={name}
            disabled={isPending}
            error={validationError?.name}
            onChange={setName}
            onBlur={validateGameInternal}
          />
          <Form.Field required error={validationError?.gameKey}>
            <label>Map</label>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span>
                {map.name}
                {map.stage !== ReleaseStage.PRODUCTION &&
                  ` (${releaseStageToString(map.stage)})`}
              </span>
              <Button
                type="button"
                size="small"
                disabled={isPending}
                onClick={() => setMapDialogOpen(true)}
                data-change-map-button
              >
                Change Map
              </Button>
            </div>
          </Form.Field>

          <MapSelectorDialog
            open={mapDialogOpen}
            onClose={() => setMapDialogOpen(false)}
            onSelectMap={setGameKey}
            initialSelection={gameKey}
            availableMaps={maps}
          />
          <FormSelect
            options={allTurnDurations.map((duration) => ({
              key: duration,
              value: duration,
              text: turnDurationToString(duration),
            }))}
            required
            label="Turn Duration"
            value={turnDuration}
            disabled={isPending}
            onChange={setTurnDuration}
            error={validationError?.turnDuration}
            autoWidth
            placeholder="Turn Duration"
            onBlur={validateGameInternal}
          />
          {(turnDuration as number) < TurnDuration.ONE_DAY && (
            <Form.Group inline>
              <label>
                Active hours{" "}
                <span style={{ fontWeight: "normal", color: "#666" }}>
                  ({detectedTimezone})
                </span>
              </label>
              <FormSelect
                options={allLocalHours}
                value={gameHoursStartLocal}
                disabled={isPending}
                onChange={setGameHoursStartLocal}
                error={validationError?.gameHoursStart}
                onBlur={validateGameInternal}
              />
              <label>to</label>
              <FormSelect
                options={allLocalHours}
                value={gameHoursEndLocal}
                disabled={isPending}
                onChange={setGameHoursEndLocal}
                error={validationError?.gameHoursDuration}
                onBlur={validateGameInternal}
              />
            </Form.Group>
          )}
          <FormInput
            required
            label={allowPlayerSelections ? "Min Players" : "Num Players"}
            type="number"
            disabled={!allowPlayerSelections}
            value={minPlayers}
            error={validationError?.minPlayers}
            onChange={setMinPlayers}
            onBlur={validateGameInternal}
          />

          {allowPlayerSelections && (
            <FormInput
              required
              label="Max Players"
              type="number"
              value={maxPlayers}
              error={validationError?.maxPlayers}
              onChange={setMaxPlayers}
              onBlur={validateGameInternal}
            />
          )}

          {environment.stage == Stage.enum.development && (
            <FormCheckbox
              toggle
              label="Artificial Start"
              checked={artificialStart}
              disabled={isPending}
              onChange={setArtificialStart}
              error={validationError?.artificialStart}
            />
          )}

          <FormInput
            label={`Minimum karma (0–${me != null ? Math.max(0, me.karma - 5) : 0})`}
            type="number"
            min={0}
            max={me != null ? Math.max(0, me.karma - 5) : 0}
            value={minKarmaS}
            error={validationError?.minKarma}
            onChange={setMinKarma}
            onBlur={validateGameInternal}
          />

          <FormCheckbox
            toggle
            data-auto-start
            label="Auto start"
            checked={autoStart}
            disabled={isPending}
            onChange={setAutoStart}
            error={validationError?.autoStart}
          />

          <FormCheckbox
            toggle
            label="Unlisted Game"
            checked={unlisted}
            disabled={isPending}
            onChange={setUnlisted}
            error={validationError?.unlisted}
          />

          {Editor && (
            <Editor
              config={variant}
              setConfig={setVariant}
              errors={validationError}
              isPending={isPending}
            />
          )}

          <Button
            primary
            data-create-button
            loading={isPending}
            disabled={isPending}
            onClick={onSubmit}
          >
            Create
          </Button>
        </Form>
      </Segment>

      <Segment>
        <MapInfo gameKey={gameKey} variant={variant} />
        <MapGridPreview gameKey={gameKey} showRiverEditor={isAdmin} />
      </Segment>
    </Container>
  );
}
