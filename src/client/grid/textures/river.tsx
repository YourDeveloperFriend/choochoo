
import { useMemo } from "react";
import { RiverTexture } from "../../../engine/state/texture";
import { BOTTOM, BOTTOM_LEFT, BOTTOM_RIGHT, Direction, directionToString, TOP, TOP_LEFT, TOP_RIGHT } from "../../../engine/state/tile";
import { assert } from "../../../utils/validate";
import { Point } from "../point";
import * as styles from './river.module.css';

interface RiverTextureProps {
  texture: RiverTexture;
  center: Point;
  size: number;
}

function toKey(directions: ReadonlyArray<Direction>): string {
  return [...directions].sort().join(':');
}

const paths = [
  [[TOP, TOP_RIGHT], 'm 40 -50 c -25 9 -7 50 -17 42 c -27 -12 14 -9 -15 -23 c -7 -8 -31 6 -31 -27'],
  [[TOP, BOTTOM_RIGHT], 'm 40 54 c -20 -20 -44 -6 -44 -45 c 0 -29 41 -26 12 -40 c -9 -5 -31 6 -31 -27'],
  [[TOP, BOTTOM], 'm -25 63 c 5 -28 -17 -29 22 -57 c 24 -21 41 -23 30 -33 c -8 -12 -49 2 -49 -31'],
  [[TOP, BOTTOM_LEFT], 'm -64 12 c 43 23 58 24 60 -6 c 0 -26 41 -23 30 -33 c -8 -12 -49 2 -49 -31'],
  [[TOP, TOP_LEFT], 'm -64 -8 c 43 43 58 44 60 14 c 0 -26 41 -23 30 -33 c -8 -12 -49 2 -49 -31'],

  [[TOP_RIGHT, BOTTOM_RIGHT], 'm 40 54 c -20 -20 -44 -6 -44 -45 c 0 -29 27 -15 12 -40 c -9 -5 15 -12 31 -19'],
  [[TOP_RIGHT, BOTTOM], 'm -24 63 c 3 -36 19 -14 19 -53 c 0 -29 27 -15 12 -40 c -9 -5 15 -12 32 -20'],
  [[TOP_RIGHT, BOTTOM_LEFT], 'm -66 9 c 47 -17 61 40 61 1 c 0 -29 27 -15 12 -40 c -9 -5 15 -12 32 -20'],
  [[TOP_RIGHT, TOP_LEFT], 'm -65 -6 c 34 23 60 55 60 16 c 0 -29 27 -15 12 -40 c -9 -5 15 -12 32 -20'],

  [[BOTTOM_RIGHT, BOTTOM], 'm -28 63 c -3 -70 23 -14 23 -53 c 0 -29 27 -15 20 12 c -14 36 10 -8 25 33'],
  [[BOTTOM_RIGHT, BOTTOM_LEFT], 'm -65 10 c 34 -17 60 39 60 0 c 0 -29 27 -15 20 12 c -14 36 10 -8 25 33'],
  [[BOTTOM_RIGHT, TOP_LEFT], 'm 39 56 c -68 -30 -90 -47 -105 -61'],


  [[BOTTOM, BOTTOM_LEFT], 'm 27 63 c 5 -70 -14 -49 -32 -53 c -25 -4 1 13 -17 11 c -16 5 -25 -26 -17 35'],
  [[BOTTOM, TOP_LEFT], 'm -22 63 c -5 -22 6 -59 -42 -71'],

  [[BOTTOM_LEFT, TOP_LEFT], 'm -38 57 c 26 -9 52 -55 33 -47 c -29 3 -2 -8 -8 -17 c -1 -35 -35 12 -53 2'],
] as const;

const pathMap = new Map(paths.map(([directions, path]) => [toKey(directions), path]));

function drawPath(center: Point, directions: Direction[]): string {
  const path = pathMap.get(toKey(directions));
  assert(path != null, `Failed to find path for ${directions.map(directionToString)}`);
  return `M ${center.x} ${center.y} ${path}`;
}

export function RiverTextureRender({ texture, center, size }: RiverTextureProps) {
  const path = useMemo(() => drawPath(center, texture.exits), [texture, center.x, center.y, size]);
  return <path d={path} className={styles.river} strokeWidth="6" strokeLinecap="butt" fill="transparent" />;
}