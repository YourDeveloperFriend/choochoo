import * as React from "react";
import { FormEvent, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Container,
  DropdownProps,
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

export function CreateGamePage() {
  const me = useMe();
  const initialMapValue =
    (useSearchParams()[0].get("map") as GameKey) ?? GameKey.RUST_BELT;
  const maps = useMemo(
    () =>
      [...ViewRegistry.singleton.values()]
        .filter((map) => map.stage !== ReleaseStage.DEPRECATED)
        .filter(
          (map) =>
            environment.stage === "development" ||
            map.stage !== ReleaseStage.DEVELOPMENT ||
            me?.role === UserRole.enum.ADMIN ||
            (map.developmentAllowlist !== undefined && me !== undefined && map.developmentAllowlist.indexOf(me.id) !== -1)
        )
        .sort((a, b) => (a.name < b.name ? -1 : 1)),
    [],
  );
  const [name, setName] = useTextInputState("");
  const [gameKey, setGameKeyState] = useState(initialMapValue);
  const [turnDuration, setTurnDuration] = useSemanticSelectState(
    TurnDuration.ONE_DAY,
  );

  const map = ViewRegistry.singleton.get(gameKey);
  const allowPlayerSelections = map.minPlayers !== map.maxPlayers;

  const selectedMap = useMemo(() => {
    return ViewRegistry.singleton.get(gameKey);
  }, [gameKey]);

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
    (selectedMap.getInitialVariantConfig?.() ?? { gameKey }) as VariantConfig,
  );
  const isAdmin = useIsAdmin();

  const minPlayers = allowPlayerSelections ? minPlayersS : map.minPlayers;
  const maxPlayers = allowPlayerSelections ? maxPlayersS : map.maxPlayers;

  const setGameKey = useCallback(
    (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
      const gameKey = data.value as GameKey;
      setGameKeyState(gameKey);
      const map = ViewRegistry.singleton.get(gameKey);
      if (typeof minPlayers === "number") {
        setMinPlayersRaw(Math.max(minPlayers, map.minPlayers));
      }
      if (typeof maxPlayers === "number") {
        setMaxPlayersRaw(Math.min(maxPlayers, map.maxPlayers));
      }
      setVariant(
        (map.getInitialVariantConfig?.() ?? { gameKey }) as VariantConfig,
      );
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
    (e: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      createGame({
        name,
        gameKey,
        artificialStart,
        turnDuration,
        minPlayers,
        maxPlayers,
        unlisted,
        autoStart,
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
      turnDuration,
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
      unlisted,
      autoStart,
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
    turnDuration,
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
          <FormSelect
            options={maps.map((m) => ({
              key: m.key,
              value: m.key,
              text:
                m.name +
                (m.stage !== ReleaseStage.PRODUCTION &&
                  ` (${releaseStageToString(m.stage)})`),
            }))}
            required
            name="map"
            label="Map"
            value={gameKey}
            disabled={isPending}
            onChange={setGameKey}
            error={validationError?.gameKey}
            autoWidth
            placeholder="Map"
            onBlur={validateGameInternal}
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
