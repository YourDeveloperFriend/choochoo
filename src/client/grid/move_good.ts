import { Grid, Space } from "../../engine/map/grid";
import { MoveData, Path } from "../../engine/move/move";
import { MoveValidator, RouteInfo } from "../../engine/move/validator";
import { PlayerData } from "../../engine/state/player";
import { HeavyLiftingData } from "../../maps/heavy_cardboard/heavy_lifting";
import { Coordinates } from "../../utils/coordinates";
import { InvalidInputError } from "../../utils/error";
import { arrayEqualsIgnoreOrder, peek } from "../../utils/functions";
import { Memoized } from "../utils/injection_context";

export function onMoveToSpaceCb(
  moveValidator: Memoized<MoveValidator>,
  moveActionProgress: EnhancedMoveData | undefined,
  setMoveActionProgress: (data: EnhancedMoveData | undefined) => void,
  grid: Grid,
  player: PlayerData | undefined,
  maybeConfirmDelivery: (data: EnhancedMoveData) => void,
  confirmHeavyLifting: (data: HeavyLiftingData) => Promise<boolean>,
) {
  return async (space?: Space) => {
    if (space == null || moveActionProgress == null || player == null) return;

    // Heavy lifting.
    const heavyLifting = await handleHeavyLifting(
      moveActionProgress,
      space,
      confirmHeavyLifting,
    );
    if (heavyLifting) return;

    const pathIndex = moveActionProgress.path.findIndex((p) =>
      p.endingStop.equals(space.coordinates),
    );
    let newData: EnhancedMoveData | undefined;
    if (space.coordinates === moveActionProgress.startingCity) {
      newData = {
        ...moveActionProgress,
        path: [],
      };
    } else if (pathIndex === -1) {
      newData = appendToPath(
        moveActionProgress,
        space,
        moveValidator.value,
        player,
      );
    } else if (pathIndex <= moveActionProgress.path.length - 2) {
      newData = {
        ...moveActionProgress,
        path: moveActionProgress.path.slice(0, pathIndex + 1),
      };
    } else {
      newData = redirectPath(
        moveActionProgress,
        space,
        grid,
        moveValidator.value,
        player,
      );
    }
    if (newData == null) return;
    setMoveActionProgress(newData);
    maybeConfirmDelivery(newData);
  };
}

async function handleHeavyLifting(
  moveActionProgress: MoveData,
  space: Space,
  maybeConfirmEmitHeavyCardboardMove: (
    data: HeavyLiftingData,
  ) => Promise<boolean>,
): Promise<boolean> {
  if (moveActionProgress.path.length > 0) return false;
  return await maybeConfirmEmitHeavyCardboardMove({
    startingCity: moveActionProgress.startingCity,
    good: moveActionProgress.good,
    endingCity: space.coordinates,
  });
}

function findValidRoutes(
  moveValidator: MoveValidator,
  player: PlayerData,
  from: Coordinates,
  to: Coordinates,
  moveData: EnhancedMoveData,
): EnhancedMoveData[] {
  return moveValidator
    .findRoutesToLocation(player, from, to)
    .map((path) => ({
      ...moveData,
      path: moveData.path.concat([
        {
          owner: path.owner,
          endingStop: path.destination,
          routeInfo: path,
          additionalData: {
            teleport: path.type === "teleport",
          },
        },
      ]),
    }))
    .filter((data) => isValidPath(moveValidator, player, data));
}

/**
 * Used to handle a "move to" request when the space is already on the movement path.
 *
 * If it's the last item in the path, it will update the owner. Otherwise, it'll chop
 * off the entire path after the current index.
 */
function redirectPath(
  moveAction: EnhancedMoveData,
  space: Space,
  grid: Grid,
  moveValidator: MoveValidator,
  player: PlayerData,
): EnhancedMoveData {
  // If it's the last item, just update the owner
  const fromSpace = grid.get(
    moveAction.path.length === 1
      ? moveAction.startingCity
      : moveAction.path[moveAction.path.length - 2].endingStop,
  )!;
  const newDatas = findValidRoutes(
    moveValidator,
    player,
    fromSpace.coordinates,
    space.coordinates,
    { ...moveAction, path: moveAction.path.slice(0, -1) },
  );
  const previousRoute = peek(moveAction.path).routeInfo;
  const previousRouteExitIndex = newDatas.findIndex((p) => {
    const { routeInfo } = peek(p.path);
    return routeInfo.type === "track"
      ? previousRoute.type === "track" &&
          routeInfo.startingTrack.equals(previousRoute.startingTrack)
      : routeInfo.type === "connection"
        ? previousRoute.type === "connection" &&
          arrayEqualsIgnoreOrder(
            routeInfo.connection.connects,
            previousRoute.connection.connects,
          )
        : previousRoute.type === "teleport";
  });
  return newDatas[(previousRouteExitIndex + 1) % newDatas.length];
}

function appendToPath(
  moveAction: EnhancedMoveData,
  space: Space,
  moveValidator: MoveValidator,
  player: PlayerData,
): EnhancedMoveData | undefined {
  const fromCoordinates =
    moveAction.path.length === 0
      ? moveAction.startingCity
      : peek(moveAction.path).endingStop;
  const paths = moveValidator.findRoutesToLocation(
    player,
    fromCoordinates,
    space.coordinates,
  );
  if (paths.length === 0) return;

  const newDataList = paths
    .map((path) => ({
      ...moveAction,
      path: moveAction.path.concat([
        {
          owner: path.owner,
          endingStop: path.destination,
          routeInfo: path,
          additionalData: {
            teleport: path.type === "teleport",
          },
        },
      ]),
    }))
    .filter((data) => isValidPath(moveValidator, player, data));
  // Prefer the path belonging to the current player.
  const newData =
    newDataList.find((data) => peek(data.path).owner === player.color) ??
    newDataList[0];

  return newData;
}

function isValidPath(
  moveValidator: MoveValidator,
  player: PlayerData,
  moveAction: MoveData,
): boolean {
  try {
    moveValidator.validatePartial(player, moveAction);
    return true;
  } catch (e) {
    if (e instanceof InvalidInputError) {
      return false;
    }
    throw e;
  }
}

interface EnhancedPath extends Path {
  routeInfo: RouteInfo;
}

export interface EnhancedMoveData extends MoveData {
  path: EnhancedPath[];
}
