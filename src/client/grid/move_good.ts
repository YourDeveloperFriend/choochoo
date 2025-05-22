import { Grid, Space } from "../../engine/map/grid";
import { MoveData, Path } from "../../engine/move/move";
import { MoveValidator, RouteInfo } from "../../engine/move/validator";
import { PlayerData } from "../../engine/state/player";
import { HeavyLiftingData } from "../../maps/heavy_cardboard/heavy_lifting";
import { InvalidInputError } from "../../utils/error";
import { arrayEqualsIgnoreOrder, peek, removeKey } from "../../utils/functions";
import { Memoized } from "../utils/injection_context";

export function onMoveToSpaceCb(
  moveValidator: Memoized<MoveValidator>,
  moveActionProgress: EnhancedMoveData | undefined,
  setMoveActionProgress: (data: EnhancedMoveData | undefined) => void,
  grid: Grid,
  player: PlayerData | undefined,
  maybeConfirmDelivery: (data: MoveData) => void,
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
      );
    }
    if (newData == null) return;
    setMoveActionProgress(newData);
    maybeConfirmDelivery({
      ...newData,
      path: newData.path.map((step) => removeKey(step, "routeInfo")),
    });
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
): EnhancedMoveData {
  // If it's the last item, just update the owner
  const fromSpace = grid.get(
    moveAction.path[moveAction.path.length - 2].endingStop,
  )!;
  const paths = moveValidator.findRoutesToLocation(
    fromSpace.coordinates,
    space.coordinates,
  );
  const previousRoute = peek(moveAction.path).routeInfo;
  const previousRouteExitIndex = paths.findIndex((p) =>
    p.type === "track"
      ? previousRoute.type === "track" &&
        p.startingTrack.equals(previousRoute.startingTrack)
      : previousRoute.type === "connection" &&
        arrayEqualsIgnoreOrder(
          p.connection.connects,
          previousRoute.connection.connects,
        ),
  );
  const nextPath = paths[(previousRouteExitIndex + 1) % paths.length];
  const newData = {
    ...moveAction,
    path: moveAction.path.slice(0, moveAction.path.length - 1).concat([
      {
        owner: nextPath.owner,
        endingStop: nextPath.destination,
        routeInfo: nextPath,
      },
    ]),
  };
  return newData;
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
