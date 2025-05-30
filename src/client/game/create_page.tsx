import * as React from "react";
import { ChangeEvent, FormEvent, useCallback, useMemo, useState } from "react";
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
import { Grid } from "../../engine/map/grid";
import { ViewRegistry } from "../../maps/view_registry";
import { log } from "../../utils/functions";
import { Point } from "../../utils/point";
import * as mapStyles from "../grid/hex.module.css";
import { HexGrid } from "../grid/hex_grid";
import * as hexGridStyles from "../grid/hex_grid.module.css";
import { environment, Stage } from "../services/environment";
import { useCreateGame } from "../services/game";
import { useLocalStorage } from "../services/local_storage";
import { useIsAdmin, useMe } from "../services/me";
import {
  useNumberInputState,
  useSemanticSelectState,
  useSemanticUiCheckboxState,
  useTextInputState,
} from "../utils/form_state";
import { MapInfo } from "./map_info";

type RiverPath = {
  absolute: boolean;
  path: Point[];
};

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
        variant: variant as VariantConfig,
      });
    },
    [
      name,
      gameKey,
      allowPlayerSelections,
      artificialStart,
      unlisted,
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
      variant: variant as VariantConfig,
    });
  }, [
    name,
    gameKey,
    artificialStart,
    minPlayers,
    maxPlayers,
    variant,
    turnDuration,
  ]);

  const [riverPath, setRiverPath] = useLocalStorage<RiverPath | undefined>(
    "riverPath",
  );

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
        <RiverEditor path={riverPath} setRiverPath={setRiverPath} />
        {grid && (
          <HexGrid
            key={gameKey}
            gameKey={gameKey}
            rotation={selectedMap.rotation}
            grid={grid}
            fullMapVersion={true}
          >
            <River path={riverPath} />
            <RiverDots path={riverPath} setRiverPath={setRiverPath} />
          </HexGrid>
        )}
      </Segment>
    </Container>
  );
}

function River({ path }: { path?: RiverPath }) {
  const dValue = useMemo(() => toDValue(path), [path]);
  if (dValue === "") return <></>;
  return <path className={mapStyles.riverPath} d={dValue} />;
}

interface RiverEditorProps {
  path?: RiverPath;
  setRiverPath: (path?: RiverPath) => void;
}

interface Dragging {
  index: number;
  startDocument: Point;
  startCircle: Point;
}

function RiverDots({ path, setRiverPath }: RiverEditorProps) {
  const [dragging, setDragging] = useState<Dragging | undefined>();
  React.useEffect(() => {
    if (dragging == null) return;
    const mousemove = (e: MouseEvent) => {
      setRiverPath({
        absolute: path!.absolute,
        path: path!.path
          .slice(0, dragging.index)
          .concat([
            {
              x:
                dragging.startCircle.x + (e.clientX - dragging.startDocument.x),
              y:
                dragging.startCircle.y + (e.clientY - dragging.startDocument.y),
            },
          ])
          .concat(path!.path.slice(dragging.index + 1)),
      });
    };
    const mouseup = () => {
      setDragging(undefined);
    };
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mouseup", mouseup);
    return () => {
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("mouseup", mouseup);
    };
  }, [dragging != null]);
  const onClick = useCallback(
    (e: React.MouseEvent<SVGCircleElement>) => {
      const target = e.target as SVGCircleElement;
      const index = Number(target.dataset["i"]);
      if (typeof index != "number" || isNaN(index)) return;
      setDragging({
        index,
        startDocument: {
          x: e.clientX,
          y: e.clientY,
        },
        startCircle: {
          x: parseFloat(target.getAttribute("cx")!),
          y: parseFloat(target.getAttribute("cy")!),
        },
      });
    },
    [setDragging],
  );
  const isAdmin = useIsAdmin();
  if (!isAdmin) return <></>;
  return (
    <>
      {path?.path.map(({ x, y }, i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={5}
          data-i={i}
          className={hexGridStyles.clickable}
          onMouseDown={onClick}
        />
      ))}
    </>
  );
}

function RiverEditor({ path, setRiverPath }: RiverEditorProps) {
  const internalSetRiverPath = useCallback(
    (value: string) => {
      setRiverPath(parseRiverPath(value));
    },
    [setRiverPath],
  );
  const toggleAbsolute = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (path == null) return;
      const newAbsolute = e.target.checked;
      if (newAbsolute === path.absolute) return;
      const newPath = [path.path[0]];
      for (const { x, y } of path.path.slice(1)) {
        if (newAbsolute) {
          const recent = newPath[Math.floor((newPath.length - 1) / 3) * 3];
          newPath.push({ x: recent.x + x, y: recent.y + y });
        } else {
          const recent = path.path[Math.floor((newPath.length - 1) / 3) * 3];
          newPath.push({ x: x - recent.x, y: y - recent.y });
        }
      }
      setRiverPath({
        path: newPath,
        absolute: newAbsolute,
      });
    },
    [setRiverPath, path],
  );
  const isAdmin = useIsAdmin();
  if (!isAdmin) return <></>;
  return (
    <>
      <input
        type="text"
        value={toDValue(path)}
        size={100}
        onChange={(e) => internalSetRiverPath(e.target.value)}
      />
      <input
        type="checkbox"
        checked={path?.absolute ?? false}
        onChange={toggleAbsolute}
      />
    </>
  );
}

function parseRiverPath(value: string): RiverPath | undefined {
  if (value === "") {
    return undefined;
  }
  const absolute = value.includes("C");
  if (value.startsWith("m ")) {
    value = value.slice(2);
  } else {
    throw new Error("Invalid river path");
  }
  const [mValue, cValue] = value.split(/C/i);
  if (cValue == null) {
    throw new Error("Invalid river path");
  }
  const riverPath: Point[] = [mValue, ...cValue.trim().split(" ")].map((v) => {
    const [x, y] = v.trim().split(",");
    return { x: parseFloat(x), y: parseFloat(y) };
  });
  return { path: riverPath, absolute };
}

function toDValue(path?: RiverPath): string {
  if (path == null) return "";
  const [first, ...rest] = path.path;
  if (rest.length === 0) return "";
  return `m ${first.x},${first.y} ${path.absolute ? "C" : "c"} ${rest.map(({ x, y }) => `${x},${y}`).join(" ")}`;
}
