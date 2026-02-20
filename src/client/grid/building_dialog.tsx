import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { toast } from "react-toastify";
import {
  Button,
  Checkbox,
  Modal,
  ModalContent,
  ModalHeader,
} from "semantic-ui-react";
import { BuildAction, BuildData } from "../../engine/build/build";
import { UrbanizeAction } from "../../engine/build/urbanize";
import { Validator } from "../../engine/build/validator";
import { AVAILABLE_CITIES } from "../../engine/game/state";
import { City } from "../../engine/map/city";
import { rotateDirectionClockwise } from "../../engine/map/direction";
import { Grid, Space } from "../../engine/map/grid";
import { GridHelper } from "../../engine/map/grid_helper";
import {
  calculateTrackInfo,
  Land,
  trackEquals,
} from "../../engine/map/location";
import { isTownTile } from "../../engine/map/tile";
import { AvailableCity } from "../../engine/state/available_city";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { Phase } from "../../engine/state/phase";
import {
  allDirections,
  allTileTypes,
  Direction,
  TileData,
} from "../../engine/state/tile";
import { PlaceAction, TO_URBANIZE } from "../../maps/soultrain/earth_to_heaven";
import { MapViewSettings } from "../../maps/view_settings";
import { Coordinates } from "../../utils/coordinates";
import { useAction } from "../services/action";
import { useIsAdmin } from "../services/me";
import { useTypedMemo } from "../utils/hooks";
import {
  Memoized,
  useInjected,
  useInjectedMemo,
  useInjectedState,
  usePhaseState,
} from "../utils/injection_context";
import {
  buildingDialogContainer,
  buildingOption,
  dialogContent,
} from "./building_dialog.module.css";
import { ClickTarget } from "./click_target";
import { HexGrid } from "./hex_grid";

interface BuildingProps {
  cancelBuild(): void;
  settings: MapViewSettings;
  coordinates?: Coordinates;
}

export function BuildingDialog({
  coordinates,
  settings,
  cancelBuild,
}: BuildingProps) {
  const { emit: emitBuild } = useAction(BuildAction);
  const isAdmin = useIsAdmin();
  const { emit: emitUrbanize, canEmit: canEmitUrbanize } =
    useAction(UrbanizeAction);
  const action = useInjectedMemo(BuildAction);
  const buildValidator = useInjectedMemo(Validator);
  const urbanizeAction = useInjectedMemo(UrbanizeAction);
  const availableCities = useInjectedState(AVAILABLE_CITIES);
  const grid = useInjected(GridHelper);
  const [showReasons, setShowReasons] = useState(false);
  const [direction, rotate] = useReducer(
    (prev: Direction, _: object) => rotateDirectionClockwise(prev),
    Direction.TOP,
  );
  const space = coordinates && (grid.lookup(coordinates) as Space);
  const { eligible, errorReason } = useTypedMemo(getEligibleBuilds, [
    action,
    buildValidator,
    coordinates,
    direction,
    showReasons,
  ]);
  const onSelect = useCallback(
    (build: BuildData) => {
      cancelBuild();
      emitBuild(build);
    },
    [cancelBuild, emitBuild],
  );

  const selectAvailableCity = useCallback(
    (cityIndex: number) => {
      cancelBuild();
      emitUrbanize({ cityIndex, coordinates: space!.coordinates });
    },
    [space, emitUrbanize],
  );

  const canUrbanize =
    canEmitUrbanize &&
    space != null &&
    availableCities.length > 0 &&
    canUrbanizeSpace(urbanizeAction, coordinates);
  const hasBuildingOptions = canUrbanize || eligible.length > 0;

  const isOpen = coordinates != null && (hasBuildingOptions || isAdmin);

  useEffect(() => {
    if (coordinates != null && !isOpen) {
      cancelBuild();
      toast.error(errorReason ?? "No eligible building options");
    }
  }, [coordinates, hasBuildingOptions, cancelBuild]);

  return (
    <>
      <Modal closeIcon open={isOpen} onClose={cancelBuild}>
        <ModalHeader>Select a tile to place</ModalHeader>
        <ModalContent className={dialogContent}>
          <p>
            <Checkbox
              label="Show failure reasons"
              checked={showReasons}
              onChange={(e, data) => setShowReasons(!!data.checked)}
            />
          </p>
          {showReasons && (
            <Button primary onClick={rotate}>
              Rotate
            </Button>
          )}
          <div className={buildingDialogContainer} data-building-options>
            {canUrbanize &&
              availableCities.map((city, index) => (
                <div
                  key={index}
                  className={buildingOption}
                >
                  <ModifiedSpace
                    space={space!}
                    settings={settings}
                    asCity={city}
                    onClick={() => selectAvailableCity(index)}
                  />
                </div>
              ))}
            {eligible.map((build, index) => (
              <div
                key={index}
                className={buildingOption}
                data-tile-type={build.tile.tileType}
                data-orientation={build.tile.orientation}
              >
                <ModifiedSpace
                  space={space!}
                  settings={settings}
                  tile={build.tile}
                  onClick={() => build.reason == null && onSelect(build.action)}
                />
                {build.reason}
              </div>
            ))}
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}

interface PlaceDialogProps {
  cancelPlace(): void;
  settings: MapViewSettings;
  coordinates?: Coordinates;
}

export function PlaceDialog({
  coordinates,
  settings,
  cancelPlace,
}: PlaceDialogProps) {
  const { emit: emitPlace } = useAction(PlaceAction);
  const cityColors = usePhaseState(Phase.EARTH_TO_HEAVEN, TO_URBANIZE);
  const cities = useMemo(
    () => cityColors?.map((color) => ({ color, onRoll: [], goods: [] })),
    [cityColors],
  );
  const grid = useInjected(GridHelper);
  const space = coordinates && (grid.lookup(coordinates) as Land);
  const onSelect = useCallback(
    (city: Good) => {
      emitPlace({ coordinates: coordinates!, city });
      cancelPlace();
    },
    [cancelPlace, emitPlace, coordinates],
  );

  const isOpen = coordinates != null;

  return (
    <>
      <Modal closeIcon open={isOpen} onClose={cancelPlace}>
        <ModalHeader>{"Select a city to place"}</ModalHeader>
        <ModalContent className={dialogContent}>
          <div className={buildingDialogContainer}>
            &quot;{space?.coordinates.toString() ?? "null"}&quot; : &quot;
            {cities?.length ?? "null"}&quot;
            {space &&
              cities?.map((city) => (
                <div key={city.color} className={buildingOption}>
                  <ModifiedSpace
                    space={space}
                    settings={settings}
                    asCity={city}
                    onClick={() => onSelect(city.color)}
                  />
                </div>
              ))}
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}

interface ModifiedSpaceProps {
  space: Space;
  tile?: TileData;
  settings: MapViewSettings;
  asCity?: AvailableCity;
  onClick?: (space: Space) => void;
}

export function ModifiedSpace({
  space,
  tile,
  settings,
  asCity,
  onClick,
}: ModifiedSpaceProps) {
  const newSpace = useMemo(() => {
    if (asCity != null) {
      return new City(space.coordinates, {
        type: SpaceType.CITY,
        name: space.name()!,
        color: asCity.color,
        goods: asCity.goods,
        urbanized: true,
        onRoll: asCity.onRoll,
      });
    } else if (space instanceof City) {
      return new City(space.coordinates, space.data);
    } else {
      const newLocationData = {
        ...space.data,
        townName:
          tile == null || isTownTile(tile.tileType)
            ? space.data.townName
            : undefined,
        tile,
      };
      return new Land(space.coordinates, newLocationData);
    }
  }, [space, tile, asCity]);
  const grid = useMemo(
    () => Grid.fromSpaces(settings, [newSpace], []),
    [newSpace],
  );
  const clickTargets = useMemo(
    () => new Set([ClickTarget.TOWN, ClickTarget.LAND, ClickTarget.CITY]),
    [],
  );
  return (
    <HexGrid
      grid={grid}
      rotation={settings.rotation}
      onClick={onClick}
      clickTargets={clickTargets}
    />
  );
}

interface EligibleBuild {
  action: BuildData;
  tile: TileData;
  reason?: string;
}

function getEligibleBuilds(
  actionProcessor: Memoized<BuildAction>,
  buildValidator: Memoized<Validator>,
  coordinates: Coordinates | undefined,
  direction: Direction,
  showReasons: boolean,
): { eligible: EligibleBuild[]; errorReason?: string } {
  if (coordinates == null) {
    return { eligible: [], errorReason: "Invalid tile placement" };
  }
  const builds = [
    ...getAllEligibleBuilds(
      actionProcessor.value,
      buildValidator.value,
      coordinates,
      showReasons ? [direction] : allDirections,
    ),
  ];
  if (builds.length === 0) {
    return { eligible: [], errorReason: "No valid builds for this location" };
  }

  const filteredDuplicates = builds.filter((build1, index) => {
    const tileInfo1 = calculateTrackInfo(build1.tile);
    return !builds.slice(index + 1).some((build2) => {
      const tileInfo2 = calculateTrackInfo(build2.tile);
      return (
        tileInfo1.length === tileInfo2.length &&
        tileInfo1.every((track1) =>
          tileInfo2.some((track2) => trackEquals(track1, track2)),
        )
      );
    });
  });
  const eligible = filteredDuplicates.filter(
    ({ reason }) => showReasons || reason == null,
  );
  if (eligible.length > 0) {
    return { eligible };
  }
  const errorReason = filteredDuplicates[0].reason!;
  if (filteredDuplicates.every(({ reason }) => reason === errorReason)) {
    return { eligible, errorReason };
  }
  return { eligible };
}

function* getAllEligibleBuilds(
  actionProcessor: BuildAction,
  validator: Validator,
  coordinates: Coordinates,
  directions: Direction[],
): Iterable<EligibleBuild> {
  for (const tileType of allTileTypes) {
    if (validator.tileMatchesTownType(coordinates, tileType) != null) {
      continue;
    }
    for (const orientation of directions) {
      const action = { orientation, tileType, coordinates };
      const tile = { orientation, tileType, owners: [] };
      try {
        actionProcessor.validate(action);
        yield { action, tile };
      } catch (e: unknown) {
        yield { action, tile, reason: (e as Error).message };
      }
    }
  }
}

function canUrbanizeSpace(action: Memoized<UrbanizeAction>, coordinates: Coordinates|undefined): boolean {
  if (!coordinates) {
    return false;
  }
  try {
    action.value.validate({coordinates: coordinates, cityIndex: 0});
    return true;
  } catch (_: unknown) {
    return false;
  }
}
