import { toast } from "react-toastify";
import { City } from "../../engine/map/city";
import { Grid, Space } from "../../engine/map/grid";
import { MoveAction, MoveData, Path } from "../../engine/move/move";
import { MoveValidator, RouteInfo } from "../../engine/move/validator";
import { Good } from "../../engine/state/good";
import { PlayerData } from "../../engine/state/player";
import { Coordinates } from "../../utils/coordinates";
import { InvalidInputError } from "../../utils/error";
import { peek } from "../../utils/functions";
import { useAction } from "../services/action";
import { useTypedCallback } from "../utils/hooks";
import {
  Memoized,
  useCurrentPlayer,
  useGrid,
  useInjectedMemo,
} from "../utils/injection_context";
import { ClickTarget, OnClickRegister } from "./click_target";

export function useMoveOnClick(
  on: OnClickRegister,
  moveActionProgress: EnhancedMoveData | undefined,
  setMoveActionProgress: (d: EnhancedMoveData | undefined) => void,
) {
  const { canEmit, isPending } = useAction(MoveAction);

  const onSelectGood = useTypedCallback(onSelectGoodCb, [
    moveActionProgress,
    setMoveActionProgress,
  ]);
  const moveValidator = useInjectedMemo(MoveValidator);
  const grid = useGrid();
  const player = useCurrentPlayer();

  const onMoveToSpace = useTypedCallback(onMoveToSpaceCb, [
    moveValidator,
    moveActionProgress,
    setMoveActionProgress,
    grid,
    player,
  ]);

  if (canEmit) {
    on(ClickTarget.GOOD, (space, good) => {
      if (!onSelectGood(space, good)) return false;
    });
    if (moveActionProgress?.good != null) {
      on(ClickTarget.TOWN, (space) => {
        onMoveToSpace(space);
      });
      on(ClickTarget.CITY, (space) => {
        onMoveToSpace(space);
      });
    }
  }
  return isPending;
}

function onSelectGoodCb(
  moveActionProgress: EnhancedMoveData | undefined,
  setMoveActionProgress: (data: EnhancedMoveData | undefined) => void,
) {
  return function (space: Space, good: Good): boolean {
    if (moveActionProgress != null) {
      if (
        moveActionProgress.startingCity.equals(space.coordinates) &&
        moveActionProgress.good === good
      ) {
        setMoveActionProgress(undefined);
        return true;
      } else if (moveActionProgress.path.length > 0) {
        // If there is an extensive path, ignore the select good call.
        return false;
      }
    }
    setMoveActionProgress({ path: [], startingCity: space.coordinates, good });
    return true;
  };
}

function onMoveToSpaceCb(
  moveValidator: Memoized<MoveValidator>,
  moveActionProgress: EnhancedMoveData | undefined,
  setMoveActionProgress: (data: EnhancedMoveData | undefined) => void,
  grid: Grid,
  player: PlayerData | undefined,
) {
  return async (space?: Space) => {
    if (space == null || moveActionProgress == null || player == null) return;

    const newData = getNewMoveData(
      grid,
      space,
      moveActionProgress,
      moveValidator.value,
      player,
    );
    if (newData == null) return;
    if (typeof newData === "string") {
      toast.error(newData);
      return;
    }
    setMoveActionProgress(newData);
  };
}

function getNewMoveData(
  grid: Grid,
  space: Space,
  moveActionProgress: EnhancedMoveData,
  moveValidator: MoveValidator,
  player: PlayerData,
): EnhancedMoveData | string | undefined {
  const pathIndex = moveActionProgress.path.findIndex((p) => {
    if (space instanceof City) {
      return space.isSameCity(grid.get(p.endingStop));
    } else {
      return space.coordinates === p.endingStop;
    }
  });

  if (space.coordinates === moveActionProgress.startingCity) {
    return {
      ...moveActionProgress,
      path: [],
    };
  } else if (pathIndex === -1) {
    return appendToPath(moveActionProgress, space, moveValidator, player);
  } else if (pathIndex <= moveActionProgress.path.length - 2) {
    return {
      ...moveActionProgress,
      path: moveActionProgress.path.slice(0, pathIndex + 1),
    };
  } else {
    return redirectPath(moveActionProgress, space, grid, moveValidator, player);
  }
}

function findAllRoutes(
  moveValidator: MoveValidator,
  player: PlayerData,
  from: Coordinates,
  to: Coordinates,
  moveData: EnhancedMoveData,
): EnhancedMoveData[] {
  return moveValidator.findRoutesToLocation(player, from, to).map((path) => ({
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
  }));
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
  const newDatas = findAllRoutes(
    moveValidator,
    player,
    fromSpace.coordinates,
    space.coordinates,
    { ...moveAction, path: moveAction.path.slice(0, -1) },
  ).filter(
    (data) => getPartialErrorReason(moveValidator, player, data) == null,
  );
  const previousRoute = peek(moveAction.path).routeInfo;
  const previousRouteExitIndex = newDatas.findIndex((p) => {
    const { routeInfo } = peek(p.path);
    return routeInfo.type === "track"
      ? previousRoute.type === "track" &&
          routeInfo.startingTrack.equals(previousRoute.startingTrack)
      : routeInfo.type === "connection"
        ? previousRoute.type === "connection" &&
          routeInfo.connection.id === previousRoute.connection.id
        : previousRoute.type === "teleport";
  });
  return newDatas[(previousRouteExitIndex + 1) % newDatas.length];
}

function appendToPath(
  moveAction: EnhancedMoveData,
  space: Space,
  moveValidator: MoveValidator,
  player: PlayerData,
): EnhancedMoveData | string {
  const fromCoordinates =
    moveAction.path.length === 0
      ? moveAction.startingCity
      : peek(moveAction.path).endingStop;
  const paths = findAllRoutes(
    moveValidator,
    player,
    fromCoordinates,
    space.coordinates,
    moveAction,
  );

  const combined = paths.map(
    (data) => getPartialErrorReason(moveValidator, player, data) ?? data,
  );

  const validPaths = combined.filter((e) => typeof e !== "string");
  const errorReasons = combined.filter((e) => typeof e === "string");

  if (validPaths.length > 0) {
    // Prefer the path belonging to the current player.
    return (
      validPaths.find((data) => peek(data.path).owner === player.color) ??
      paths[0]
    );
  }

  if (errorReasons.length > 0) {
    const errorReasonsDeduped = new Set(errorReasons);
    if (errorReasonsDeduped.size === 1) return errorReasons[0];
  }
  return "No valid route found";
}

function getPartialErrorReason(
  moveValidator: MoveValidator,
  player: PlayerData,
  moveAction: MoveData,
): string | undefined {
  try {
    moveValidator.validatePartial(player, moveAction);
    return undefined;
  } catch (e) {
    if (e instanceof InvalidInputError) {
      return e.message;
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
