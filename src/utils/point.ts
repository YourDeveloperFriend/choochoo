import { Exit, TOWN } from "../engine/map/track";
import { Direction } from "../engine/state/tile";
import { Coordinates } from "./coordinates";
import { assertNever } from "./validate";

export function movePointInRadDirection(
  point: Point,
  size: number,
  rad: number,
): Point {
  return {
    x: Math.round(point.x + Math.cos(rad) * size),
    y: Math.round(point.y + Math.sin(rad) * size),
  };
}

export function polygon(points: Point[]): string {
  return points.map((p) => [p.x, p.y].join(" ")).join(",");
}

export function coordinatesToCenter(
  coordinates: Coordinates,
  size: number,
): Point {
  return {
    x: size * (1.5 * coordinates.q),
    y:
      size *
      ((Math.sqrt(3) / 2) * coordinates.q + Math.sqrt(3) * coordinates.r),
  };
}

export interface Point {
  x: number;
  y: number;
}

export const RIGHT = 0;
export const BOTTOM_RIGHT = Math.PI / 3;
export const BOTTOM_LEFT = (Math.PI * 2) / 3;
export const LEFT = Math.PI;
export const TOP_LEFT = (Math.PI * 4) / 3;
export const TOP_RIGHT = (Math.PI * 5) / 3;

const allCornerLocations = [
  RIGHT,
  BOTTOM_RIGHT,
  BOTTOM_LEFT,
  LEFT,
  TOP_LEFT,
  TOP_RIGHT,
];

/** Returns corners, starting with the right corner and rotating clockwise. */
export function getCorners(center: Point, size: number): Point[] {
  return allCornerLocations.map((cornerLocation) =>
    movePointInRadDirection(center, size, cornerLocation),
  );
}

export function getHalfCorners(center: Point, size: number): Point[] {
  const [topRight, right, bottomRight] = [TOP_RIGHT, RIGHT, BOTTOM_RIGHT].map(
    (cornerLocation) => movePointInRadDirection(center, size, cornerLocation),
  );

  const top = { x: center.x, y: topRight.y };
  const bottom = { x: center.x, y: bottomRight.y };
  return [top, topRight, right, bottomRight, bottom];
}

/** Returns corners of an edge of a hex. */
export function edgeCorners(
  center: Point,
  size: number,
  direction: Direction,
): Point[] {
  return edgeAngles(direction).map((angle) =>
    movePointInRadDirection(center, size, angle),
  );
}

function edgeAngles(direction: Direction): number[] {
  switch (direction) {
    case Direction.TOP_LEFT:
      return [LEFT, TOP_LEFT];
    case Direction.TOP:
      return [TOP_LEFT, TOP_RIGHT];
    case Direction.TOP_RIGHT:
      return [TOP_RIGHT, RIGHT];
    case Direction.BOTTOM_RIGHT:
      return [RIGHT, BOTTOM_RIGHT];
    case Direction.BOTTOM:
      return [BOTTOM_RIGHT, BOTTOM_LEFT];
    case Direction.BOTTOM_LEFT:
      return [BOTTOM_LEFT, LEFT];
  }
}

export function getExitPoint(center: Point, exit: Exit, size: number): Point {
  if (exit === TOWN) return center;

  return movePointInDirection(center, size, exit);
}

export function directionToRad(direction: Direction): number {
  switch (direction) {
    case Direction.TOP_RIGHT:
      return (Math.PI * 11) / 6;
    case Direction.TOP:
      return (Math.PI * 3) / 2;
    case Direction.TOP_LEFT:
      return (Math.PI * 7) / 6;
    case Direction.BOTTOM_LEFT:
      return (Math.PI * 5) / 6;
    case Direction.BOTTOM:
      return Math.PI / 2;
    case Direction.BOTTOM_RIGHT:
      return Math.PI / 6;
    default:
      assertNever(direction);
  }
}

export function distanceToSide(size: number): number {
  // Size refers to the space between the center and a corner. As such, the space between the center and
  // a side is different.
  return Math.cos(Math.PI / 6) * size;
}

export function movePointInDirection(
  point: Point,
  size: number,
  direction: Direction,
): Point {
  return movePointInRadDirection(
    point,
    distanceToSide(size),
    directionToRad(direction),
  );
}
