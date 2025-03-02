import CloseIcon from "@mui/icons-material/Close";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import { useNotifications } from "@toolpad/core";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { BuildAction, BuildData } from "../../engine/build/build";
import { UrbanizeAction } from "../../engine/build/urbanize";
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
import { Action } from "../../engine/state/action";
import { AvailableCity } from "../../engine/state/available_city";
import { SpaceType } from "../../engine/state/location_type";
import {
  allDirections,
  allTileTypes,
  Direction,
  TileData,
} from "../../engine/state/tile";
import { MapViewSettings } from "../../maps/view_settings";
import { Coordinates } from "../../utils/coordinates";
import { useAction } from "../services/game";
import { useTypedMemo } from "../utils/hooks";
import {
  useCurrentPlayer,
  useInjected,
  useInjectedState,
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
  const { emit: emitUrbanize } = useAction(UrbanizeAction);
  const action = useInjected(BuildAction);
  const curr = useCurrentPlayer();
  const availableCities = useInjectedState(AVAILABLE_CITIES);
  const grid = useInjected(GridHelper);
  const [showReasons, setShowReasons] = useState(false);
  const [direction, rotate] = useReducer(
    (prev: Direction, _: object) => rotateDirectionClockwise(prev),
    Direction.TOP,
  );
  const space = coordinates && (grid.lookup(coordinates) as Land);
  const eligible = useTypedMemo(getEligibleBuilds, [
    action,
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
    curr?.selectedAction === Action.URBANIZATION &&
    space != null &&
    space.hasTown() &&
    availableCities.length > 0;
  const hasBuildingOptions = canUrbanize || eligible.length > 0;

  const isOpen = coordinates != null && hasBuildingOptions;

  const notifications = useNotifications();

  useEffect(() => {
    if (coordinates != null && !hasBuildingOptions) {
      cancelBuild();
      notifications.show("No eligible building options", {
        autoHideDuration: 2000,
        severity: "error",
      });
    }
  }, [coordinates, hasBuildingOptions, cancelBuild]);

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={cancelBuild}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle>{"Select a tile to place"}</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={cancelBuild}
          sx={() => ({
            position: "absolute",
            right: 8,
            top: 8,
            color: "grey",
          })}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent className={dialogContent}>
          <p>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showReasons}
                  onChange={(e) => setShowReasons(e.target.checked)}
                />
              }
              label="Show failure reasons"
            />
          </p>
          {showReasons && <Button onClick={rotate}>Rotate</Button>}
          <div className={buildingDialogContainer}>
            {curr?.selectedAction === Action.URBANIZATION &&
              space != null &&
              space.hasTown() &&
              availableCities.map((city, index) => (
                <div
                  key={city.onRoll[0].group * 10 + city.onRoll[0].onRoll}
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
              <div key={index} className={buildingOption}>
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
        </DialogContent>
      </Dialog>
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
    if (space instanceof City) {
      return new City(space.coordinates, space.data);
    } else if (asCity != null) {
      return new City(space.coordinates, {
        type: SpaceType.CITY,
        name: space.name()!,
        color: asCity.color,
        goods: asCity.goods,
        urbanized: true,
        onRoll: asCity.onRoll,
      });
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
    () => new Set([ClickTarget.TOWN, ClickTarget.LOCATION, ClickTarget.CITY]),
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
  actionProcessor: BuildAction,
  coordinates: Coordinates | undefined,
  direction: Direction,
  showReasons: boolean,
): EligibleBuild[] {
  if (coordinates == null) return [];
  const builds = [
    ...getAllEligibleBuilds(
      actionProcessor,
      coordinates,
      showReasons ? [direction] : allDirections,
    ),
  ].filter(({ reason }) => showReasons || reason == null);
  return builds.filter((build1, index) => {
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
}

function* getAllEligibleBuilds(
  actionProcessor: BuildAction,
  coordinates: Coordinates,
  directions: Direction[],
): Iterable<EligibleBuild> {
  for (const tileType of allTileTypes) {
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
