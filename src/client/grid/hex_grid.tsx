import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutline from '@mui/icons-material/RemoveCircleOutline';
import { Fab, Tooltip } from "@mui/material";
import { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Grid, Space } from "../../engine/map/grid";
import { Track } from "../../engine/map/track";
import { Good } from "../../engine/state/good";
import { Coordinates } from "../../utils/coordinates";
import { useTypedCallback } from "../utils/hooks";
import { ClickTarget } from "./click_target";
import { Hex } from "./hex";
import { fabs, floatingFabs, hexGrid, hexGridContainer } from './hex_grid.module.css';
import { coordinatesToCenter, getCorners, Point } from "./point";


function cubeRound(qFrac: number, rFrac: number): Coordinates {
  const sFrac = - (qFrac + rFrac);
  let q = Math.round(qFrac)
  let r = Math.round(rFrac)
  let s = Math.round(sFrac)

  const qDiff = Math.abs(q - qFrac)
  const rDiff = Math.abs(r - rFrac)
  const sDiff = Math.abs(s - sFrac)

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  } else {
    s = -q - r;
  }

  return Coordinates.from({ q, r });
}


function pixelToCoordinates(point: Point, size: number): Coordinates {
  const q = (2. / 3 * point.x) / size;
  const r = (-1. / 3 * point.x + Math.sqrt(3) / 3 * point.y) / size;
  return cubeRound(q, r);
}

interface HexGridProps {
  grid: Grid;
  onClick?: (space: Space, good?: Good) => void;
  highlightedTrack?: Track[];
  selectedGood?: { good: Good, coordinates: Coordinates };
  clickTargets?: Set<ClickTarget>;
  allowZoom?: boolean;
}

function onClickCb(grid: Grid, zoom: number, offset: Point, size: number, onClick?: (space: Space, good?: Good) => void) {
  return (e: MouseEvent) => {
    if (onClick == null) return;
    const canvas = e.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const coordinates = pixelToCoordinates({
      x: e.clientX - rect.left - (offset.x * zoom),
      y: e.clientY - rect.top - (offset.y * zoom),
    }, size * zoom);

    const space = grid.get(coordinates);
    if (space == null) return;

    const maybeGood = (e.target as HTMLElement).dataset.good;
    if (maybeGood == null) return onClick(space);
    onClick(space, parseInt(maybeGood) as Good);
  };
}

function useZoom(allowZoom?: boolean) {
  const key = 'choo:preferredZoom';
  const [internalZoom, setZoom] = useState(() => parseFloat(localStorage.getItem(key) ?? '1'));

  const zoom = Math.max(Math.min(internalZoom, 3), 0.2);

  useEffect(() => {
    localStorage.setItem(key, `${zoom}`);
  }, [zoom]);

  if (allowZoom != true) return [1, () => { }] as const;

  return [zoom, setZoom] as const;
}

export function HexGrid({ onClick, allowZoom, highlightedTrack, selectedGood, grid, clickTargets }: HexGridProps) {
  const [zoom, setZoom] = useZoom(allowZoom);
  const size = 70;
  const padding = 20;

  const spaces = useMemo(() => [...grid.values()], [grid]);

  const offset: Point = useMemo(() => {
    const allCorners = spaces.flatMap(({ coordinates: c }) => getCorners(coordinatesToCenter(c, size), size));
    return {
      x: padding - Math.min(...allCorners.map(c => c.x)),
      y: padding - Math.min(...allCorners.map(c => c.y)),
    };
  }, [size, padding, ...spaces]);

  const viewBox: Point = useMemo(() => {
    const allCorners = spaces.flatMap(({ coordinates: c }) => getCorners(coordinatesToCenter(c, size), size));
    return {
      x: Math.max(...allCorners.map((c => c.x))) + offset.x + padding,
      y: Math.max(...allCorners.map((c => c.y))) + offset.y + padding,
    };
  }, [size, padding, ...spaces]);

  const internalOnClick = useTypedCallback(onClickCb, [grid, zoom, offset, size, onClick]);

  const zoomIn = useCallback(() => {
    setZoom(zoom + 0.05);
  }, [zoom, setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(zoom - 0.05);
  }, [zoom, setZoom]);

  const normalizeZoom = useCallback(() => {
    setZoom(1);
  }, [zoom, setZoom]);

  const clickTargetsNormalized = useMemo(() => clickTargets ?? new Set<ClickTarget>(), [clickTargets]);

  const mapSpaces = [];

  // There should be the same number of spaces, so useMemo should be safe here.
  for (const space of spaces) {
    const highlightedTrackInSpace = useMemo(() =>
      highlightedTrack?.filter((track) => track.coordinates.equals(space.coordinates))
      , [highlightedTrack]);
    const highlightedTrackSerialized = (highlightedTrackInSpace ?? []).map((track) => `${track.coordinates.serialize()}|${track.getExits().join(':')}`).join('?');
    mapSpaces.push(useMemo(() =>
      hexFactory(space, selectedGood, highlightedTrackInSpace, offset, size, clickTargetsNormalized),
      [space, selectedGood, highlightedTrackSerialized, offset.x, offset.y, size, clickTargetsNormalized]));
  }

  const mapBox = useMemo(() => ({
    width: viewBox.x * zoom,
    height: viewBox.y * zoom,
  }), [zoom, viewBox]);

  return <>
    {allowZoom && <div className={`${fabs} ${zoom > 0.4 ? floatingFabs : ''}`}>
      <Tooltip title="Zoom out">
        <Fab color="primary" size="small" onClick={zoomOut} disabled={zoom <= 0.2}>
          <RemoveCircleOutline />
        </Fab>
      </Tooltip>
      <Tooltip title="Back to 0">
        <Fab color="primary" size="small" onClick={normalizeZoom}>
          0
        </Fab>
      </Tooltip>
      <Tooltip title="Zoom in">
        <Fab color="primary" size="small" onClick={zoomIn} disabled={zoom > 3}>
          <AddCircleOutline />
        </Fab>
      </Tooltip>
    </div>}
    <div className={hexGridContainer}>
      <svg xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${viewBox.x} ${viewBox.y}`}
        width={mapBox.width}
        height={mapBox.height}
        fill="currentColor"
        className={`bi bi-google ${hexGrid}`}
        onClick={internalOnClick}>
        {mapSpaces}
      </svg>
    </div>
  </>;
}

function hexFactory(
  space: Space,
  selectedGood: { good: Good, coordinates: Coordinates } | undefined,
  highlightedTrack: Track[] | undefined,
  offset: Point,
  size: number,
  clickTargets: Set<ClickTarget>) {
  return <Hex key={space.coordinates.serialize()}
    selectedGood={selectedGood}
    highlightedTrack={highlightedTrack}
    offset={offset}
    space={space}
    size={size}
    clickTargets={clickTargets} />
}