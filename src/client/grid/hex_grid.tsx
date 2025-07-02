import {
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Popup } from "semantic-ui-react";
import { GameKey } from "../../api/game_key";
import { Rotation } from "../../engine/game/map_settings";
import { Grid, Space } from "../../engine/map/grid";
import { Track } from "../../engine/map/track";
import { Good } from "../../engine/state/good";
import { OwnedInterCityConnection } from "../../engine/state/inter_city_connection";
import { Direction } from "../../engine/state/tile";
import { ViewRegistry } from "../../maps/view_registry";
import { Coordinates } from "../../utils/coordinates";
import { deepEquals } from "../../utils/deep_equals";
import { DoubleHeight } from "../../utils/double_height";
import { iterate } from "../../utils/functions";
import {
  coordinatesToCenter,
  distanceToSide,
  movePointInDirection,
  Point,
} from "../../utils/point";
import { assert } from "../../utils/validate";
import { Rotate } from "../components/rotation";
import { SwedenProgressionGraphic } from "../game/sweden/progression_graphic";
import { useTypedCallback } from "../utils/hooks";
import { ClickTarget } from "./click_target";
import { getTerrainHexes } from "./hex";
import * as styles from "./hex_grid.module.css";
import { InterCityConnectionRender } from "./inter_city_connection";

interface HexGridProps {
  id?: string;
  grid: Grid;
  rotation?: Rotation;
  spaceToConfirm?: Space;
  onSpaceConfirm?: () => void;
  onClick?: (space: Space, good?: Good) => void;
  onClickInterCity?: (id: string) => void;
  highlightedSpaces?: Set<Coordinates>;
  highlightedTrack?: Track[];
  highlightedConnections?: OwnedInterCityConnection[];
  selectedGood?: { good: Good; coordinates: Coordinates };
  clickTargets?: Set<ClickTarget>;
  fullMapVersion?: boolean;
  gameKey?: GameKey;
  children?: ReactNode;
}

function onClickCb(grid: Grid, onClick?: (space: Space, good?: Good) => void) {
  return (e: MouseEvent) => {
    if (onClick == null) return;
    const coordinatesStr = (e.target as HTMLElement)?.dataset?.coordinates;
    if (coordinatesStr != null) {
      const coordinates = Coordinates.unserialize(coordinatesStr);

      const space = grid.get(coordinates);
      if (space == null) return;

      const maybeGood = (e.target as HTMLElement).dataset.good;
      if (maybeGood == null) return onClick(space);
      onClick(space, parseInt(maybeGood) as Good);
    }
  };
}

function useZoom(allowZoom?: boolean) {
  const key = "choo:preferredZoom";
  const [internalZoom, setZoom] = useState(() =>
    parseFloat(localStorage.getItem(key) ?? "1"),
  );

  const zoom = Math.max(Math.min(internalZoom, 3), 0.2);

  useEffect(() => {
    localStorage.setItem(key, `${zoom}`);
  }, [zoom]);

  if (allowZoom != true) return [1, () => {}] as const;

  return [zoom, setZoom] as const;
}

export function HexGrid({
  id,
  onClick,
  onClickInterCity,
  rotation,
  fullMapVersion,
  highlightedSpaces,
  spaceToConfirm,
  onSpaceConfirm,
  highlightedTrack,
  highlightedConnections,
  selectedGood,
  grid,
  clickTargets,
  gameKey,
  children,
}: HexGridProps) {
  const allowZoom = fullMapVersion;
  const [zoom, setZoom] = useZoom(allowZoom);
  const size = 70;
  const padding = 20;
  const numberSpacing = fullMapVersion ? 50 : 0;

  const spaces = useMemo(() => [...grid.values()], [grid]);

  const internalOnClick = useTypedCallback(onClickCb, [grid, onClick]);

  const zoomIn = useCallback(() => {
    setZoom(zoom + 0.05);
  }, [zoom, setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(zoom - 0.05);
  }, [zoom, setZoom]);

  const normalizeZoom = useCallback(() => {
    setZoom(1);
  }, [zoom, setZoom]);

  const clickTargetsNormalized = useMemo(
    () => clickTargets ?? new Set<ClickTarget>(),
    [clickTargets],
  );

  // There should be the same number of spaces, so useMemo should be safe here.
  const terrainHexes = {
    beforeTextures: [] as ReactNode[][],
    afterTextures: [] as ReactNode[][],
    afterOverlay: [] as ReactNode[][],
  };
  for (const space of spaces) {
    const isHighlighted = useMemo(
      () => highlightedSpaces?.has(space.coordinates) ?? false,
      [highlightedSpaces],
    );
    const highlightedTrackInSpace = useMemo(
      () =>
        highlightedTrack?.filter((track) =>
          track.coordinates.equals(space.coordinates),
        ),
      [highlightedTrack],
    );
    const highlightedTrackSerialized = (highlightedTrackInSpace ?? [])
      .map(
        (track) =>
          `${track.coordinates.serialize()}|${track.getExits().join(":")}`,
      )
      .join("?");
    const newTerrainHexes = useMemo(
      () =>
        getTerrainHexes({
          isHighlighted,
          space,
          size,
          clickTargets: clickTargetsNormalized,
          highlightedTrack: highlightedTrackInSpace,
          rotation,
          selectedGood,
        }),
      [
        isHighlighted,
        grid.topLeft,
        grid.bottomRight,
        space,
        size,
        clickTargetsNormalized,
        rotation,
        highlightedTrackSerialized,
        selectedGood,
      ],
    );

    aggregate(terrainHexes.beforeTextures, newTerrainHexes.beforeTextures);
    aggregate(terrainHexes.afterTextures, newTerrainHexes.afterTextures);
    aggregate(terrainHexes.afterOverlay, newTerrainHexes.afterOverlay);

    function aggregate<T>(outputArr: T[][], inputArr: T[]) {
      for (const [index, space] of inputArr.entries()) {
        if (outputArr[index] == null) {
          outputArr[index] = [];
        }
        outputArr[index].push(space);
      }
    }
  }

  let texturesLayer: ReactNode = null;
  let overlayLayer: ReactNode = null;
  if (gameKey) {
    const mapSettings = ViewRegistry.singleton.get(gameKey);
    if (mapSettings.getTexturesLayer) {
      texturesLayer = mapSettings.getTexturesLayer({
        size,
        grid,
        clickTargets,
      });
    }
    if (mapSettings.getOverlayLayer) {
      overlayLayer = mapSettings.getOverlayLayer({
        size,
        grid,
        clickTargets,
      });
    }
  }

  const ref = useRef<SVGGElement>(null);

  const [internalViewBox, setViewBox] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  useLayoutEffect(() => {
    if (ref.current == null) return;

    const bbox = ref.current.getBBox();

    const newViewBox = {
      x: Math.round(bbox.x),
      y: Math.round(bbox.y),
      width: Math.round(bbox.width),
      height: Math.round(bbox.height),
    };
    if (!deepEquals(newViewBox, internalViewBox)) {
      setViewBox(newViewBox);
    }
  }, [ref, internalViewBox]);

  const viewBox = useMemo(
    () => ({
      x: internalViewBox.x - padding - numberSpacing,
      y: internalViewBox.y - padding - numberSpacing,
      width: internalViewBox.width + 2 * padding + numberSpacing,
      height: internalViewBox.height + 2 * padding + numberSpacing,
    }),
    [internalViewBox, padding, numberSpacing],
  );

  return (
    <>
      {allowZoom && (
        <div
          className={`${styles.fabs} ${zoom > 0.4 ? styles.floatingFabs : ""}`}
        >
          <Popup
            content="Zoom out"
            trigger={
              <Button
                primary
                circular
                icon="minus"
                size="small"
                onClick={zoomOut}
                disabled={zoom <= 0.2}
              />
            }
          />
          <Popup
            content="Back to 0"
            trigger={
              <Button
                primary
                circular
                icon="circle outline"
                size="small"
                onClick={normalizeZoom}
              />
            }
          />
          <Popup
            content="Zoom in"
            trigger={
              <Button
                primary
                circular
                icon="plus"
                size="small"
                onClick={zoomIn}
                disabled={zoom > 3}
              />
            }
          />
        </div>
      )}
      <div className={styles.hexGridContainer}>
        <svg
          data-hex-grid={id}
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          className={`bi bi-google ${styles.hexGrid}`}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          width={viewBox.width * zoom}
          height={viewBox.height * zoom}
          onClick={internalOnClick}
        >
          {fullMapVersion && (
            <DoubleHeightNumbers
              origin={internalViewBox}
              spacing={numberSpacing}
              rotation={rotation}
              grid={grid}
              size={size}
            />
          )}
          <defs>
            <filter id="cubeShadow" width={size / 3} height={size / 3}>
              <feOffset in="SourceAlpha" dx={size / 15} dy={size / 15} />
              <feGaussianBlur stdDeviation={size / 30} />
              <feBlend in="SourceGraphic" in2="blurOut" />
            </filter>
          </defs>
          <g ref={ref}>
            {/* Rotating without a center moves it along the origin, but we rely on the viewBox calculation to make sure the view box fits the content. */}
            <Rotate rotation={rotation}>
              {terrainHexes.beforeTextures}
              {texturesLayer}
              {terrainHexes.afterTextures}
              {overlayLayer}
              {terrainHexes.afterOverlay}
              {grid.connections.map((connection, index) => (
                <InterCityConnectionRender
                  key={index}
                  highlighted={highlightedConnections?.some(
                    (c) => connection.id === c.id,
                  )}
                  clickTargets={clickTargetsNormalized}
                  onClick={onClickInterCity}
                  size={size}
                  connection={connection}
                />
              ))}
              {fullMapVersion && <SwedenProgressionGraphic />}
              {children}
              {spaceToConfirm && (
                <ConfirmHex
                  grid={grid}
                  space={spaceToConfirm}
                  size={size}
                  onSpaceConfirm={onSpaceConfirm!}
                  rotation={rotation}
                />
              )}
            </Rotate>
          </g>
        </svg>
      </div>
    </>
  );
}

interface DoubleHeightNumbersProps {
  grid: Grid;
  size: number;
  origin: Point;
  spacing: number;
  rotation?: Rotation;
}

function DoubleHeightNumbers({
  grid,
  size,
  origin,
  spacing,
  rotation,
}: DoubleHeightNumbersProps) {
  return useMemo(() => {
    return (
      <>
        {...iterate(grid.bottomRight.col - grid.topLeft.col + 1, (index) => (
          <DoubleHeightNumber
            index={index}
            rotation={rotation}
            origin={origin}
            spacing={spacing}
            size={size}
            isRow={false}
          />
        ))}
        {...iterate(grid.bottomRight.row - grid.topLeft.row + 1, (index) => (
          <DoubleHeightNumber
            index={index}
            rotation={rotation}
            origin={origin}
            spacing={spacing}
            size={size}
            isRow={true}
          />
        ))}
      </>
    );
  }, [
    grid.topLeft.col,
    grid.topLeft.row,
    grid.bottomRight.col,
    grid.bottomRight.row,
    rotation,
    size,
    origin,
  ]);
}

interface DoubleHeightNumberProps {
  index: number;
  rotation?: Rotation;
  origin: Point;
  spacing: number;
  size: number;
  isRow: boolean;
}

function DoubleHeightNumber({
  index,
  rotation,
  origin,
  spacing,
  size,
  isRow,
}: DoubleHeightNumberProps) {
  const distance = distanceToSide(size);
  const doubleHeight = DoubleHeight.from(index, index);

  const xTransform = doubleHeight.toPoint(size).x + size;
  const yTransform = doubleHeight.toPoint(size).y + distance;

  const xBasis = origin.x - spacing;
  const yBasis = origin.y - spacing;

  const x =
    rotation != null
      ? isRow
        ? yTransform + origin.x
        : xBasis
      : isRow
        ? xBasis
        : xTransform + origin.x;

  const y =
    rotation != null
      ? isRow
        ? yBasis
        : xTransform + origin.y
      : isRow
        ? yTransform + origin.y
        : yBasis;

  const content = isRow
    ? doubleHeight.toRowString()
    : doubleHeight.toColString();

  return (
    <text x={x} y={y} dominantBaseline="middle" textAnchor="middle">
      {content}
    </text>
  );
}

interface ConfirmHexProps {
  grid: Grid;
  space: Space;
  size: number;
  rotation?: Rotation;
  onSpaceConfirm(): void;
}

function ConfirmHex({
  grid,
  space,
  size,
  rotation,
  onSpaceConfirm,
}: ConfirmHexProps) {
  const coordinates = space.coordinates;
  const radius = size * 0.4;
  const directions = useMemo(
    () => [
      Direction.TOP,
      Direction.BOTTOM,
      Direction.TOP_LEFT,
      Direction.BOTTOM_LEFT,
      Direction.TOP_RIGHT,
      Direction.BOTTOM_RIGHT,
    ],
    [],
  );
  const center = useMemo(() => {
    const center = coordinatesToCenter(coordinates, size);
    const direction = directions.find(
      (direction) =>
        grid.get(space.coordinates.neighbor(direction)) != null ||
        grid.get(space.coordinates.neighbor(direction).neighbor(direction)) !=
          null ||
        grid.get(
          space.coordinates
            .neighbor(direction)
            .neighbor(direction)
            .neighbor(direction),
        ) != null,
    );
    assert(
      direction != null,
      "attempted to find direction to place confirm but one not found",
    );
    return movePointInDirection(center, size * 1.3, direction);
  }, [grid, coordinates, size]);

  return (
    <>
      <g transform={`translate(${center.x}, ${center.y})`}>
        <Rotate rotation={rotation} reverse>
          <circle fill="black" r={radius} onClick={onSpaceConfirm} />
          <circle
            fill="white"
            r={radius}
            className={styles.clickable}
            onClick={onSpaceConfirm}
          />
          <g transform="translate(-15,-15) scale(1.6)">
            <path
              d="M19.903 2.828 20.075 0 6.641 13.435 3.102 9.09 0 11.616l6.338 7.779L22.903 2.828z"
              fill="green"
            />
          </g>
        </Rotate>
      </g>
    </>
  );
}
