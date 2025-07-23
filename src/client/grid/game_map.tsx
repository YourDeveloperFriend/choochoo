import { BuildAction } from "../../engine/build/build";
import { inject } from "../../engine/framework/execution_context";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { GridVersionHelper } from "../../engine/map/grid_version_helper";
import { Track } from "../../engine/map/track";
import { MoveHelper } from "../../engine/move/helper";
import { MoveAction, MoveData } from "../../engine/move/move";
import { Good } from "../../engine/state/good";
import { OwnedInterCityConnection } from "../../engine/state/inter_city_connection";
import { PlayerColor, playerColorToString } from "../../engine/state/player";
import { PlaceAction } from "../../maps/soultrain/earth_to_heaven";
import { Coordinates } from "../../utils/coordinates";
import { peek, removeKeys } from "../../utils/functions";
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
  useViewSettings,
} from "../utils/injection_context";
import { BuildingDialog, PlaceDialog } from "./building_dialog";
import { useOnClick } from "./click_target";
import { HexGrid } from "./hex_grid";
import { EnhancedMoveData } from "./move_good";
import { InterceptMoveModal, useMoveInterceptionState } from "./move_intercept";

function getHighlightedConnections(
  grid: Grid,
  moveActionProgress: EnhancedMoveData | undefined,
): OwnedInterCityConnection[] {
  if (moveActionProgress == null) return [];
  return moveActionProgress.path.flatMap(({ routeInfo }) => {
    if (routeInfo.type !== "connection") {
      return [];
    }
    return [routeInfo.connection];
  });
}

function getHighlightedSpaces(
  moveActionProgress: EnhancedMoveData | undefined,
): Set<Coordinates> {
  if (moveActionProgress == null) return new Set();
  return new Set(
    moveActionProgress.path.flatMap(({ routeInfo }, index) => {
      if (routeInfo.type !== "teleport") return [];
      const origin =
        index === 0
          ? moveActionProgress.startingCity
          : moveActionProgress.path[index - 1].endingStop;
      return [origin, routeInfo.destination];
    }),
  );
}

function getHighlightedTrack(
  grid: Grid,
  moveActionProgress: EnhancedMoveData | undefined,
): Track[] {
  if (moveActionProgress == null) return [];
  return moveActionProgress.path.flatMap(({ routeInfo }) => {
    if (routeInfo.type !== "track") return [];
    return grid.getRoute(routeInfo.startingTrack);
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

function confirmDeliveryCb(
  moveAction: EnhancedMoveData | undefined,
  player: PlayerColor | undefined,
  moveInstance: Memoized<MoveAction>,
  confirm: ConfirmCallback,
  grid: Grid,
  emitMove: (moveData: MoveData) => void,
  maybeInterceptMove: (moveData: MoveData, cityName: string) => boolean,
) {
  return () => {
    if (moveAction == null) return;
    const endingStop = grid.get(peek(moveAction.path).endingStop) as City;
    if (maybeInterceptMove(moveAction, endingStop.name())) return;
    const message = getConfirmDeliveryMessage(
      player,
      moveAction,
      grid,
      moveInstance.value,
    );
    confirm(message, {
      confirmButton: "Confirm Delivery",
      cancelButton: "Cancel",
    }).then((confirmed) => {
      if (!confirmed) return;
      emitMove({
        ...moveAction,
        path: moveAction.path.map((step) => removeKeys(step, "routeInfo")),
      });
    });
  };
}

export function getConfirmDeliveryMessage(
  player: PlayerColor | undefined,
  moveAction: MoveData,
  grid: Grid,
  moveInstance: MoveAction,
) {
  const endingStop = grid.get(peek(moveAction.path).endingStop) as City;
  const income = moveInstance.calculateIncome(moveAction);
  const counts = [...income]
    .filter(([owner, income]) => owner != null && income != 0)
    .map(
      ([owner, income]) =>
        `${owner === player ? "you" : playerColorToString(owner)} ${income} income`,
    );
  const countsStr = counts.length > 0 ? counts.join(", ") : "zero income";
  return `Deliver to ${endingStop.name()}? This will give ${countsStr}.`;
}

function getConfirmDeliveryCity(
  grid: Grid,
  moveAction: MoveData | undefined,
  moveHelper: Memoized<MoveHelper>,
): City | undefined {
  if (moveAction == null) return;
  if (moveAction.path.length === 0) return;
  const endingStop = grid.get(peek(moveAction.path).endingStop);
  if (
    endingStop instanceof City &&
    moveHelper.value.canDeliverTo(endingStop, moveAction.good)
  ) {
    return endingStop;
  }
}

export function GameMap() {
  const { emit: emitMove } = useAction(MoveAction);
  const moveInstance: Memoized<MoveAction<MoveData>> =
    useInjectedMemo(MoveAction);
  const { maybeInterceptMove, ...interceptMoveState } =
    useMoveInterceptionState();

  const gridVersion = useInject(
    () => inject(GridVersionHelper).getGridVersion(),
    [],
  );

  const player = useCurrentPlayer();
  const grid = useGrid();
  const { data: buildData, clearData: clearBuildData } = useAction(BuildAction);
  const { data: placeData, clearData: clearPlaceData } = useAction(PlaceAction);
  const moveHelper = useInjectedMemo(MoveHelper);
  const gameKey = useGameKey();

  const mapSettings = useViewSettings();

  const confirm = useConfirm();

  const [moveActionProgress, setMoveActionProgress] = useGameVersionState<
    EnhancedMoveData | undefined
  >(undefined);

  const confirmDelivery = useTypedCallback(confirmDeliveryCb, [
    moveActionProgress,
    player?.color,
    moveInstance,
    confirm,
    grid,
    emitMove,
    maybeInterceptMove,
  ]);

  const confirmDeliveryCity = useTypedMemo(getConfirmDeliveryCity, [
    grid,
    moveActionProgress,
    moveHelper,
  ]);

  const highlightedSpaces = useTypedMemo(getHighlightedSpaces, [
    moveActionProgress,
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

  const { clickTargets, onClick, onClickInterCity } = useOnClick(
    moveActionProgress,
    setMoveActionProgress,
  );

  return (
    <>
      <HexGrid
        id="main-map"
        key={gridVersion}
        onClick={onClick}
        onClickInterCity={onClickInterCity}
        fullMapVersion={true}
        highlightedSpaces={highlightedSpaces}
        highlightedTrack={highlightedTrack}
        highlightedConnections={highlightedConnections}
        clickTargets={clickTargets}
        selectedGood={selectedGood}
        rotation={mapSettings.rotation}
        spaceToConfirm={confirmDeliveryCity}
        onSpaceConfirm={confirmDelivery}
        grid={grid}
        gameKey={gameKey}
      />
      <BuildingDialog
        coordinates={buildData?.coordinates}
        settings={mapSettings}
        cancelBuild={() => clearBuildData()}
      />
      <PlaceDialog
        coordinates={placeData?.coordinates}
        settings={mapSettings}
        cancelPlace={() => clearPlaceData()}
      />
      <InterceptMoveModal {...interceptMoveState} />
    </>
  );
}
