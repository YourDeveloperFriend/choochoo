import { useCallback, useMemo } from "react";
import { BuildAction } from "../../engine/build/build";
import { ClaimAction, ClaimData } from "../../engine/build/claim";
import { ConnectCitiesAction } from "../../engine/build/connect_cities";
import { inject } from "../../engine/framework/execution_context";
import { City } from "../../engine/map/city";
import { Grid, Space } from "../../engine/map/grid";
import { GridVersionHelper } from "../../engine/map/grid_version_helper";
import { Land } from "../../engine/map/location";
import { Track } from "../../engine/map/track";
import { MoveHelper } from "../../engine/move/helper";
import { MoveAction, MoveData, Path } from "../../engine/move/move";
import { MoveValidator } from "../../engine/move/validator";
import { Good } from "../../engine/state/good";
import { OwnedInterCityConnection } from "../../engine/state/inter_city_connection";
import {
  PlayerColor,
  playerColorToString,
  PlayerData,
} from "../../engine/state/player";
import {
  ProductionAction as DiscoProductionAction,
  ProductionData,
} from "../../maps/disco/production";
import {
  HeavyLiftingAction,
  HeavyLiftingData,
} from "../../maps/heavy_cardboard/heavy_lifting";
import {
  SelectCityAction,
  SelectCityData,
} from "../../maps/india-steam-brothers/production";
import {
  DeurbanizeAction,
  DeurbanizeData,
} from "../../maps/ireland/deurbanization";
import {
  RepopulateAction,
  RepopulateData,
} from "../../maps/montreal_metro/select_action/repopulate";
import { PlaceAction } from "../../maps/soultrain/earth_to_heaven";
import { ViewRegistry } from "../../maps/view_registry";
import { Coordinates } from "../../utils/coordinates";
import { arrayEqualsIgnoreOrder, peek, removeKey } from "../../utils/functions";
import { ConfirmCallback, useConfirm } from "../components/confirm";
import { useAction } from "../services/action";
import { useGameVersionState } from "../services/game";
import { useTypedCallback, useTypedMemo } from "../utils/hooks";
import {
  Memoized,
  useCurrentPlayer,
  useGameKey,
  useGrid,
  useInject,
  useInjectedMemo,
} from "../utils/injection_context";
import { BuildingDialog, PlaceDialog } from "./building_dialog";
import { ClickTarget } from "./click_target";
import { HexGrid } from "./hex_grid";
import { InterceptMoveModal, useMoveInterceptionState } from "./move_intercept";

interface EnhancedPath extends Path {
  startingConnection: Track | OwnedInterCityConnection;
}

interface EnhancedMoveData extends MoveData {
  path: EnhancedPath[];
}

function buildPaths(
  moveValidator: MoveValidator,
  startingStop: Coordinates,
  endingStop: Coordinates,
): EnhancedPath[] {
  return [
    ...moveValidator.findRoutesToLocationLegacy(startingStop, endingStop),
  ].map((connection) => {
    if (connection instanceof Track) {
      return {
        owner: connection.getOwner(),
        endingStop,
        startingConnection: connection,
      };
    } else {
      // InterCityConnection
      return {
        owner: connection.owner!.color,
        startingConnection: connection,
        endingStop,
      };
    }
  });
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

function useMaybeConfirmEmitHeavyLifting() {
  const confirm = useConfirm();
  const { getErrorMessage, emit, canEmit } = useAction(HeavyLiftingAction);
  return useCallback(
    async (data: HeavyLiftingData) => {
      if (!canEmit) return false;
      if (getErrorMessage(data) != null) return false;
      if (!(await confirm("Use heavy cardboard move?"))) {
        return false;
      }
      emit(data);
      return true;
    },
    [confirm, emit, canEmit, getErrorMessage],
  );
}

function onMoveToSpaceCb(
  moveValidator: Memoized<MoveValidator>,
  moveHelper: Memoized<MoveHelper>,
  moveActionProgress: EnhancedMoveData | undefined,
  setMoveActionProgress: (data: EnhancedMoveData | undefined) => void,
  grid: Grid,
  player: PlayerData | undefined,
  maybeConfirmDelivery: (data: EnhancedMoveData) => void,
  maybeConfirmEmitHeavyCardboardMove: (
    data: HeavyLiftingData,
  ) => Promise<boolean>,
) {
  return async (space?: Space) => {
    if (space == null || moveActionProgress == null || player == null) return;
    const entirePath = [
      moveActionProgress.startingCity,
      ...moveActionProgress.path.map((p) => p.endingStop),
    ];
    if (moveActionProgress.path.length === 0) {
      const actionData: HeavyLiftingData = {
        startingCity: moveActionProgress.startingCity,
        good: moveActionProgress.good,
        endingCity: space.coordinates,
      };
      if (await maybeConfirmEmitHeavyCardboardMove(actionData)) {
        return;
      }
    }
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
      const paths = buildPaths(
        moveValidator.value,
        fromSpace.coordinates,
        space.coordinates,
      );
      if (paths.length === 1) {
        maybeConfirmDelivery(moveActionProgress);
        return;
      }
      const previousStartingConnection = peek(
        moveActionProgress.path,
      ).startingConnection;
      const previousRouteExitIndex = paths.findIndex((p) =>
        p.startingConnection instanceof Track
          ? previousStartingConnection instanceof Track &&
            p.startingConnection.equals(previousStartingConnection)
          : !(previousStartingConnection instanceof Track) &&
            arrayEqualsIgnoreOrder(
              p.startingConnection.connects,
              previousStartingConnection.connects,
            ),
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
    const paths = buildPaths(
      moveValidator.value,
      fromSpace.coordinates,
      space.coordinates,
    );
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
  moveActionProgress: EnhancedMoveData | undefined,
): OwnedInterCityConnection[] {
  if (moveActionProgress == null) return [];
  return moveActionProgress.path.flatMap(({ startingConnection }) => {
    if (startingConnection instanceof Track) {
      return [];
    }
    return [startingConnection];
  });
}

function getHighlightedTrack(
  grid: Grid,
  moveActionProgress: EnhancedMoveData | undefined,
): Track[] {
  if (moveActionProgress == null) return [];
  return moveActionProgress.path.flatMap(({ startingConnection }) => {
    if (!(startingConnection instanceof Track)) return [];
    return grid.getRoute(startingConnection);
  });
}

function getSelectedGood(
  moveActionProgress: EnhancedMoveData | undefined,
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
  onSelectGood: (space: Space, good: Good) => boolean,
  setBuildingSpace: (space: Land) => void,
  onMoveToSpace: (space: Space) => void,
  canEmitDiscoProduction: boolean,
  emitDiscoProduction: (data: ProductionData) => void,
  canEmitPlaceAction: boolean,
  setPlaceSpace: (space: Land) => void,
  canEmitRepopulate: boolean,
  emitRepopulate: (data: RepopulateData) => void,
  repopulateGood?: Good,
) {
  return (space: Space, good?: Good) => {
    if (isPending) return;
    if (canEmitRepopulate && repopulateGood != null) {
      emitRepopulate({
        good: repopulateGood,
        coordinates: space.coordinates,
      });
      return;
    }
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

    if (canEmitPlaceAction && space instanceof Land && space.hasTown()) {
      setPlaceSpace(space);
      return;
    }
  };
}

function maybeConfirmDeliveryCb(
  player: PlayerColor | undefined,
  moveHelper: Memoized<MoveHelper>,
  moveInstance: Memoized<MoveAction>,
  confirm: ConfirmCallback,
  grid: Grid,
  emitMove: (moveData: MoveData) => void,
  maybeInterceptMove: (moveData: MoveData, cityName: string) => boolean,
) {
  return (moveActionProgress: EnhancedMoveData | undefined) => {
    if (moveActionProgress == null) return;
    if (moveActionProgress.path.length === 0) return;
    const endingStop = grid.get(peek(moveActionProgress.path).endingStop);
    if (
      endingStop instanceof City &&
      moveHelper.value.canDeliverTo(endingStop, moveActionProgress.good)
    ) {
      if (maybeInterceptMove(moveActionProgress, endingStop.name())) return;
      const income = moveInstance.value.calculateIncome(moveActionProgress);
      const counts = [...income]
        .filter(([a]) => a != null)
        .map(
          ([owner, income]) =>
            `${owner === player ? "you" : playerColorToString(owner)} ${income} income`,
        );
      const countsStr = counts.length > 0 ? counts.join(", ") : "zero income";
      const message = `Deliver to ${endingStop.name()}? This will give ${countsStr}.`;
      confirm(message, {
        confirmButton: "Confirm Delivery",
        cancelButton: "Cancel",
      }).then((confirmed) => {
        if (!confirmed) return;
        emitMove({
          ...moveActionProgress,
          path: moveActionProgress.path.map((step) =>
            removeKey(step, "startingConnection"),
          ),
        });
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
  const moveInstance = useInjectedMemo(MoveAction);
  const { maybeInterceptMove, ...interceptMoveState } =
    useMoveInterceptionState();
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
    data: repopulateData,
    canEmit: canEmitRepopulate,
    emit: emitRepopulate,
    isPending: isRepopulatePending,
  } = useAction(RepopulateAction);
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
  const { canEmit: canEmitPlaceAction } = useAction(PlaceAction);
  const gridVersion = useInject(
    () => inject(GridVersionHelper).getGridVersion(),
    [],
  );

  const player = useCurrentPlayer();
  const grid = useGrid();
  const [buildingSpace, setBuildingSpace] = useGameVersionState<
    Land | undefined
  >(undefined);
  const [placeSpace, setPlaceSpace] = useGameVersionState<Land | undefined>(
    undefined,
  );
  const moveHelper = useInjectedMemo(MoveHelper);
  const moveValidator = useInjectedMemo(MoveValidator);
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
    isDiscoProductionPending ||
    isRepopulatePending;

  const confirm = useConfirm();

  const [moveActionProgress, setMoveActionProgress] = useGameVersionState<
    EnhancedMoveData | undefined
  >(undefined);

  const onSelectGood = useTypedCallback(onSelectGoodCb, [
    moveActionProgress,
    setMoveActionProgress,
  ]);

  const maybeConfirmDelivery = useTypedCallback(maybeConfirmDeliveryCb, [
    player?.color,
    moveHelper,
    moveInstance,
    confirm,
    grid,
    emitMove,
    maybeInterceptMove,
  ]);

  const maybeConfirmEmitHeavyLifting = useMaybeConfirmEmitHeavyLifting();

  const onMoveToSpace = useTypedCallback(onMoveToSpaceCb, [
    moveValidator,
    moveHelper,
    moveActionProgress,
    setMoveActionProgress,
    grid,
    player,
    maybeConfirmDelivery,
    maybeConfirmEmitHeavyLifting,
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
    canEmitPlaceAction,
    setPlaceSpace,
    canEmitRepopulate,
    emitRepopulate,
    repopulateData?.good,
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
    if (canEmitPlaceAction) {
      return new Set([ClickTarget.TOWN]);
    }
    if (canEmitRepopulate && repopulateData?.good != null) {
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
    canEmitPlaceAction,
    canEmitRepopulate,
    repopulateData?.good,
  ]);

  const onClickInterCity = useCallback((connect: Coordinates[]) => {
    emitConnectCity({ connect });
  }, []);

  return (
    <>
      <HexGrid
        key={gridVersion}
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
      <PlaceDialog
        coordinates={placeSpace?.coordinates}
        settings={mapSettings}
        cancelPlace={() => setPlaceSpace(undefined)}
      />
      <InterceptMoveModal {...interceptMoveState} />
    </>
  );
}
