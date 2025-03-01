import { DialogHook, useDialogs } from "@toolpad/core";
import { useCallback, useMemo } from "react";
import { BuildAction } from "../../engine/build/build";
import { ClaimAction, ClaimData } from "../../engine/build/claim";
import { ConnectCitiesAction } from "../../engine/build/connect_cities";
import { City } from "../../engine/map/city";
import { getOpposite } from "../../engine/map/direction";
import { Grid, Space } from "../../engine/map/grid";
import { Land } from "../../engine/map/location";
import { Track } from "../../engine/map/track";
import { MoveHelper } from "../../engine/move/helper";
import { MoveAction, MoveData, Path } from "../../engine/move/move";
import { Good } from "../../engine/state/good";
import { OwnedInterCityConnection } from "../../engine/state/inter_city_connection";
import { PlayerData } from "../../engine/state/player";
import { isDirection } from "../../engine/state/tile";
import {
  ProductionAction as DiscoProductionAction,
  ProductionData,
} from "../../maps/disco/production";
import {
  SelectCityAction,
  SelectCityData,
} from "../../maps/india-steam-brothers/production";
import {
  DeurbanizeAction,
  DeurbanizeData,
} from "../../maps/ireland/deurbanization";
import { ViewRegistry } from "../../maps/view_registry";
import { Coordinates } from "../../utils/coordinates";
import { peek } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { useAction, useGameVersionState } from "../services/game";
import { useTypedCallback, useTypedMemo } from "../utils/hooks";
import {
  Memoized,
  useCurrentPlayer,
  useGameKey,
  useGrid,
  useInjectedMemo,
} from "../utils/injection_context";
import { BuildingDialog } from "./building_dialog";
import { ClickTarget } from "./click_target";
import { HexGrid } from "./hex_grid";

function buildPaths(
  grid: Grid,
  startingStop: Coordinates,
  endingStop: Coordinates,
): Path[] {
  return [...grid.findRoutesToLocation(startingStop, endingStop)].map(
    (connection) => {
      if (connection instanceof Track) {
        const track = connection;
        if (track.coordinates.equals(startingStop)) {
          // Town track, return non-town exit.
          return {
            owner: track.getOwner(),
            endingStop,
            startingExit: track.getExits().find(isDirection)!,
          };
        }
        return {
          owner: track.getOwner(),
          endingStop,
          startingExit: getOpposite(
            track
              .getExits()
              .filter(isDirection)
              .find((e) => track.coordinates.neighbor(e).equals(startingStop))!,
          ),
        };
      } else {
        // InterCityConnection
        return {
          owner: connection.owner!.color,
          endingStop,
          startingExit: startingStop.getDirection(endingStop),
        };
      }
    },
  );
}

function onSelectGoodCb(
  moveActionProgress: MoveData | undefined,
  setMoveActionProgress: (data: MoveData | undefined) => void,
) {
  return function (city: City, good: Good): boolean {
    if (moveActionProgress != null) {
      if (
        moveActionProgress.startingCity.equals(city.coordinates) &&
        moveActionProgress.good === good
      ) {
        setMoveActionProgress(undefined);
        return true;
      } else if (moveActionProgress.path.length > 0) {
        // If there is an extensive path, ignore the select good call.
        return false;
      }
    }
    setMoveActionProgress({ path: [], startingCity: city.coordinates, good });
    return true;
  };
}

function onMoveToSpaceCb(
  moveHelper: Memoized<MoveHelper>,
  moveActionProgress: MoveData | undefined,
  setMoveActionProgress: (data: MoveData | undefined) => void,
  grid: Grid,
  player: PlayerData | undefined,
  maybeConfirmDelivery: (data: MoveData) => void,
) {
  return (space?: Space) => {
    if (space == null || moveActionProgress == null || player == null) return;
    const entirePath = [
      moveActionProgress.startingCity,
      ...moveActionProgress.path.map((p) => p.endingStop),
    ];
    const entirePathIndex = entirePath.findIndex((p) =>
      p.equals(space.coordinates),
    );
    if (entirePathIndex >= 0) {
      // Ignore all but the last two elements
      if (entirePathIndex < entirePath.length - 2) return;
      if (entirePathIndex === entirePath.length - 2) {
        // Remove the last element of the path.
        setMoveActionProgress({
          ...moveActionProgress,
          path: moveActionProgress.path.slice(0, entirePathIndex),
        });
        return;
      }
      if (entirePathIndex === 0) return;
      // Otherwise, just update the owner
      const fromSpace = grid.get(entirePath[entirePath.length - 2])!;
      const paths = buildPaths(grid, fromSpace.coordinates, space.coordinates);
      if (paths.length === 1) {
        maybeConfirmDelivery(moveActionProgress);
        return;
      }
      const previousRouteExit = peek(moveActionProgress.path).startingExit;
      const previousRouteExitIndex = paths.findIndex(
        (p) => p.startingExit === previousRouteExit,
      );
      const nextPath = paths[(previousRouteExitIndex + 1) % paths.length];
      const newData = {
        ...moveActionProgress,
        path: moveActionProgress.path
          .slice(0, entirePathIndex - 1)
          .concat([nextPath]),
      };
      setMoveActionProgress(newData);
      maybeConfirmDelivery(newData);
      return;
    }
    const fromSpace = grid.get(peek(entirePath))!;
    if (
      entirePath.length > 1 &&
      fromSpace instanceof City &&
      !moveHelper.value.canMoveThrough(fromSpace, moveActionProgress.good)
    )
      return;
    const paths = buildPaths(grid, fromSpace.coordinates, space.coordinates);
    if (paths.length === 0) return;

    // Prefer the path belonging to the current player.
    const path = paths.find((p) => p.owner === player!.color) ?? paths[0];
    const newData = {
      ...moveActionProgress,
      path: moveActionProgress.path.concat([path]),
    };
    if (!moveHelper.value.isWithinLocomotive(player, newData)) return;
    setMoveActionProgress(newData);
    maybeConfirmDelivery(newData);
  };
}

function getHighlightedConnections(
  grid: Grid,
  moveActionProgress: MoveData | undefined,
): OwnedInterCityConnection[] {
  if (moveActionProgress == null) return [];
  return moveActionProgress.path.flatMap((p, index) => {
    const startingStop =
      index === 0
        ? moveActionProgress.startingCity
        : moveActionProgress.path[index - 1].endingStop;
    const connection = grid.connection(startingStop, p.startingExit);
    if (
      connection == null ||
      connection instanceof City ||
      connection instanceof Track
    ) {
      return [];
    }
    return [connection];
  });
}

function getHighlightedTrack(
  grid: Grid,
  moveActionProgress: MoveData | undefined,
): Track[] {
  if (moveActionProgress == null) return [];
  return moveActionProgress.path.flatMap((p, index) => {
    const startingStop =
      index === 0
        ? moveActionProgress.startingCity
        : moveActionProgress.path[index - 1].endingStop;
    const connection = grid.connection(startingStop, p.startingExit);
    if (!(connection instanceof Track)) return [];
    return grid.getRoute(connection);
  });
}

function getSelectedGood(
  moveActionProgress: MoveData | undefined,
): { good: Good; coordinates: Coordinates } | undefined {
  if (!moveActionProgress) return undefined;
  return {
    good: moveActionProgress.good,
    coordinates: moveActionProgress.startingCity,
  };
}

function onClickCb(
  isPending: boolean,
  canEmitClaim: boolean,
  emitClaim: (data: ClaimData) => void,
  canEmitBuild: boolean,
  canEmitDeurbanize: boolean,
  emitDeurbanize: (data: DeurbanizeData) => void,
  canEmitSelectCity: boolean,
  emitSelectCity: (data: SelectCityData) => void,
  canEmitMove: boolean,
  onSelectGood: (city: City, good: Good) => boolean,
  setBuildingSpace: (space: Land) => void,
  onMoveToSpace: (space: Space) => void,
  canEmitDiscoProduction: boolean,
  emitDiscoProduction: (data: ProductionData) => void,
) {
  return (space: Space, good?: Good) => {
    if (isPending) return;
    if (canEmitSelectCity) {
      emitSelectCity({ coordinates: space.coordinates });
      return;
    }
    if (canEmitDiscoProduction) {
      emitDiscoProduction({ coordinates: space.coordinates });
      return;
    }
    if (canEmitClaim) {
      if (
        space instanceof Land &&
        space.getTrack().some((track) => track.isClaimable())
      ) {
        emitClaim({ coordinates: space.coordinates });
        return;
      }
    }
    if (canEmitDeurbanize) {
      if (good != null) {
        emitDeurbanize({ coordinates: space.coordinates, good });
      }
      return;
    }
    if (canEmitMove) {
      if (good != null) {
        assert(space instanceof City);
        if (onSelectGood(space, good)) {
          return;
        }
      }
      onMoveToSpace(space);
      return;
    }
    if (canEmitBuild && space instanceof Land) {
      setBuildingSpace(space);
      return;
    }
  };
}

function maybeConfirmDeliveryCb(
  moveHelper: Memoized<MoveHelper>,
  dialogs: DialogHook,
  grid: Grid,
  emitMove: (moveData: MoveData) => void,
) {
  return (moveActionProgress: MoveData | undefined) => {
    if (moveActionProgress == null) return;
    if (moveActionProgress.path.length === 0) return;
    const endingStop = grid.get(peek(moveActionProgress.path).endingStop);
    if (
      endingStop instanceof City &&
      moveHelper.value.canDeliverTo(endingStop, moveActionProgress.good)
    ) {
      dialogs
        .confirm("Deliver to " + endingStop.name(), {
          okText: "Confirm Delivery",
          cancelText: "Cancel",
        })
        .then((confirmed) => {
          if (!confirmed) return;
          emitMove(moveActionProgress);
        });
    }
  };
}

export function GameMap() {
  const { canEmit: canEmitBuild, isPending: isBuildPending } =
    useAction(BuildAction);
  const {
    canEmit: canEmitMove,
    emit: emitMove,
    isPending: isMovePending,
  } = useAction(MoveAction);
  const {
    canEmit: canEmitClaim,
    emit: emitClaim,
    isPending: isClaimPending,
  } = useAction(ClaimAction);
  const {
    canEmit: canEmitDeurbanize,
    emit: emitDeurbanize,
    isPending: isDeurbanizePending,
  } = useAction(DeurbanizeAction);
  const {
    canEmit: canEmitSelectCity,
    emit: emitSelectCity,
    isPending: isSelectCityPending,
  } = useAction(SelectCityAction);
  const {
    canEmit: canEmitDiscoProduction,
    emit: emitDiscoProduction,
    isPending: isDiscoProductionPending,
  } = useAction(DiscoProductionAction);
  const { emit: emitConnectCity, isPending: isConnectCityPending } =
    useAction(ConnectCitiesAction);

  const player = useCurrentPlayer();
  const grid = useGrid();
  const [buildingSpace, setBuildingSpace] = useGameVersionState<
    Land | undefined
  >(undefined);
  const moveHelper = useInjectedMemo(MoveHelper);
  const gameKey = useGameKey();

  const mapSettings = useMemo(
    () => ViewRegistry.singleton.get(gameKey),
    [gameKey],
  );

  const isPending =
    isBuildPending ||
    isMovePending ||
    isDeurbanizePending ||
    isClaimPending ||
    isSelectCityPending ||
    isConnectCityPending ||
    isDiscoProductionPending;

  const dialogs = useDialogs();

  const [moveActionProgress, setMoveActionProgress] = useGameVersionState<
    MoveData | undefined
  >(undefined);

  const onSelectGood = useTypedCallback(onSelectGoodCb, [
    moveActionProgress,
    setMoveActionProgress,
  ]);

  const maybeConfirmDelivery = useTypedCallback(maybeConfirmDeliveryCb, [
    moveHelper,
    dialogs,
    grid,
    emitMove,
  ]);

  const onMoveToSpace = useTypedCallback(onMoveToSpaceCb, [
    moveHelper,
    moveActionProgress,
    setMoveActionProgress,
    grid,
    player,
    maybeConfirmDelivery,
  ]);

  const highlightedTrack = useTypedMemo(getHighlightedTrack, [
    grid,
    moveActionProgress,
  ]);
  const highlightedConnections = useTypedMemo(getHighlightedConnections, [
    grid,
    moveActionProgress,
  ]);

  const selectedGood = useTypedMemo(getSelectedGood, [moveActionProgress]);

  const onClick = useTypedCallback(onClickCb, [
    isPending,
    canEmitClaim,
    emitClaim,
    canEmitBuild,
    canEmitDeurbanize,
    emitDeurbanize,
    canEmitSelectCity,
    emitSelectCity,
    canEmitMove,
    onSelectGood,
    setBuildingSpace,
    onMoveToSpace,
    canEmitDiscoProduction,
    emitDiscoProduction,
  ]);

  const clickTargets: Set<ClickTarget> = useMemo(() => {
    if (isPending) return new Set();
    if (canEmitMove) {
      return new Set([ClickTarget.GOOD, ClickTarget.TOWN, ClickTarget.CITY]);
    }
    if (canEmitDeurbanize) {
      return new Set([ClickTarget.GOOD]);
    }
    if (canEmitDiscoProduction) {
      return new Set([ClickTarget.CITY]);
    }
    if (canEmitBuild) {
      return new Set([ClickTarget.LOCATION, ClickTarget.INTER_CITY_CONNECTION]);
    }
    if (canEmitSelectCity) {
      return new Set([ClickTarget.CITY]);
    }
    return new Set();
  }, [
    canEmitMove,
    canEmitDeurbanize,
    canEmitBuild,
    isPending,
    canEmitSelectCity,
    canEmitDiscoProduction,
  ]);

  const onClickInterCity = useCallback((connect: Coordinates[]) => {
    emitConnectCity({ connect });
  }, []);

  return (
    <>
      <HexGrid
        onClick={onClick}
        onClickInterCity={onClickInterCity}
        fullMapVersion={true}
        highlightedTrack={highlightedTrack}
        highlightedConnections={highlightedConnections}
        clickTargets={clickTargets}
        selectedGood={selectedGood}
        rotation={mapSettings.rotation}
        grid={grid}
        gameKey={gameKey}
      />
      <BuildingDialog
        coordinates={buildingSpace?.coordinates}
        settings={mapSettings}
        cancelBuild={() => setBuildingSpace(undefined)}
      />
    </>
  );
}
