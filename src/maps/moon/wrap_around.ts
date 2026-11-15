import { Grid, Space } from "../../engine/map/grid";
import { Direction } from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";

export function getNeighbor(
  grid: Grid,
  coordinates: Coordinates,
  dir: Direction,
): Space | undefined {
  const neighborCoordinates = coordinates.neighbor(dir);
  const neighbor = grid.get(neighborCoordinates);
  if (neighbor != null) {
    return neighbor;
  }
  const moonBase = grid.cities().find((city) => city.name() === "Moon Base")!;
  const newCoordinates = Coordinates.from({
    q: moonBase.coordinates.q - (coordinates.q - moonBase.coordinates.q),
    r: moonBase.coordinates.r - (coordinates.r - moonBase.coordinates.r),
  });
  return grid.get(newCoordinates);
}
