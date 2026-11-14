import { Good } from "../../engine/state/good";
import { Coordinates } from "../../utils/coordinates";
import { toLetter } from "../../engine/state/city_group";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { Rotation } from "../../engine/game/map_settings";
import { coordinatesToCenter, Point } from "../../utils/point";

export function cityMembers(city: City, grid: Grid): City[] {
  return city.data.sameCity == null
    ? [city]
    : [...grid.getSameCities(city)].sort(
        (a, b) => b.onRoll().length - a.onRoll().length,
      );
}

export function cityCenter(members: City[], size: number): Point {
  const centers = members.map((city) =>
    coordinatesToCenter(city.coordinates, size),
  );
  return {
    x: centers.reduce((sum, p) => sum + p.x, 0) / centers.length,
    y: centers.reduce((sum, p) => sum + p.y, 0) / centers.length,
  };
}

export function uprightPoint(point: Point, rotation?: Rotation): Point {
  if (rotation === Rotation.CLOCKWISE) {
    return { x: -point.y, y: point.x };
  }
  if (rotation === Rotation.COUNTER_CLOCKWISE) {
    return { x: point.y, y: -point.x };
  }
  return point;
}

/** Remove shared hex edges and trace only the compound City's outside perimeter. */
export function cityOutline(members: City[], size: number): Point[] {
  const key = (p: Point) =>
    `${Math.round(p.x * 1000)},${Math.round(p.y * 1000)}`;
  const edges = new Map<string, [Point, Point]>();
  for (const city of members) {
    const center = coordinatesToCenter(city.coordinates, size);
    const corners = Array.from({ length: 6 }, (_, i) => ({
      x: center.x + size * Math.cos((i * Math.PI) / 3),
      y: center.y + size * Math.sin((i * Math.PI) / 3),
    }));
    corners.forEach((a, i) => {
      const b = corners[(i + 1) % 6],
        id = [key(a), key(b)].sort().join("|");
      if (edges.has(id)) {
        edges.delete(id);
      } else {
        edges.set(id, [a, b]);
      }
    });
  }
  const remaining = [...edges.values()];
  const ordered = [remaining.shift()!];
  while (remaining.length) {
    const last = ordered[ordered.length - 1][1];
    const next = remaining.findIndex(([a]) => key(a) === key(last));
    if (next < 0) {
      throw new Error("Compound City perimeter is disconnected");
    }
    ordered.push(remaining.splice(next, 1)[0]);
  }
  return ordered.map(([a]) => a);
}

/** User-facing City identity even when an urbanized Town has no printed name. */
export function honeybeeCityDisplayName(
  grid: Grid,
  coordinates: Coordinates,
): string {
  const city = grid.get(coordinates);
  if (city instanceof City && city.isUrbanized() && city.onRoll().length) {
    return `City ${toLetter(city.onRoll()[0])} (${grid.toDoubleHeightDisplay(coordinates).toString()})`;
  }
  return grid.displayName(coordinates);
}

/** Upright offsets matching the three printed compound-City identifiers. */
export function cityIdentifier(size: number, large: boolean, color?: Good) {
  const points = large
    ? color === Good.PURPLE
      ? { number: { x: -0.35, y: 0 }, bee: { x: 0.4, y: 0 } }
      : color === Good.RED
        ? { number: { x: 0.16, y: 0.25 }, bee: { x: -0.4, y: -0.45 } }
        : { number: { x: 0.16, y: -0.25 }, bee: { x: -0.26, y: 0.5 } }
    : { number: { x: 0, y: -0.07 }, bee: { x: 0, y: 0.325 } };
  const width = size * (large ? 0.6 : 0.46);
  const height = size * (large ? 0.44 : 0.33);
  return {
    number: { x: points.number.x * size, y: points.number.y * size },
    bee: {
      x: points.bee.x * size - width / 2,
      y: points.bee.y * size - height / 2,
      width,
      height,
    },
  };
}
