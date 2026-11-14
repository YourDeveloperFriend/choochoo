import { InterCityConnection } from "../../engine/state/inter_city_connection";
import {
  directionToRad,
  movePointInDirection,
  movePointInRadDirection,
  coordinatesToCenter,
} from "../../utils/point";
import { boardCoordinates as c } from "./grid";

export function honeybeeInterurbanPosition(
  connection: InterCityConnection,
  size: number,
  connections?: InterCityConnection[],
) {
  const [zero, pair, slot] = connection.id.split("-").map(Number);
  if (zero !== 0) {
    return undefined;
  }
  const edges = {
    1: [c(5, 5), c(5, 6)],
    2: [c(6, 5), c(7, 5)],
    3: [c(6, 7), c(7, 6)],
  };
  const neighbor = edges[pair as keyof typeof edges]?.[(slot - 1) % 2];
  if (!neighbor) {
    return undefined;
  }
  const center = coordinatesToCenter(c(6, 6), size),
    other = coordinatesToCenter(neighbor, size);
  const midpoint = { x: (center.x + other.x) / 2, y: (center.y + other.y) / 2 };
  const doubled = connections?.some(
    (c) => c.id.startsWith(`0-${pair}-`) && Number(c.id.split("-")[2]) > 2,
  );
  if (!doubled) {
    return midpoint;
  }
  const dx = other.x - center.x,
    dy = other.y - center.y;
  const length = Math.hypot(dx, dy);
  const offset = size * (slot <= 2 ? -0.19 : 0.19);
  return {
    x: midpoint.x - (dy / length) * offset,
    y: midpoint.y + (dx / length) * offset,
  };
}

/** Match the actual renderer, including its compact parallel-link spacing. */
export function honeybeeInterurbanCircles(
  connections: InterCityConnection[],
  size: number,
) {
  return connections.map((connection) => {
    let center = honeybeeInterurbanPosition(connection, size, connections);
    if (!center) {
      const colocated = connections.filter((other) =>
        other.connects.every((coord) =>
          connection.connects.some((c) => c.equals(coord)),
        ),
      );
      const index = colocated.findIndex((other) => other.id === connection.id);
      const [first, second] = connection.connects;
      const direction = first.getDirection(second);
      center = movePointInRadDirection(
        movePointInDirection(coordinatesToCenter(first, size), size, direction),
        (index - (colocated.length - 1) / 2) * size * 0.375,
        directionToRad(direction) + Math.PI / 2,
      );
    }
    return { ...center, radius: size / 6 };
  });
}
