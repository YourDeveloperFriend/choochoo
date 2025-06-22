import { useCallback, useMemo } from "react";
import { BuildAction } from "../../engine/build/build";
import { ClaimAction } from "../../engine/build/claim";
import { ConnectCitiesAction } from "../../engine/build/connect_cities";
import { City } from "../../engine/map/city";
import { Space } from "../../engine/map/grid";
import { Land } from "../../engine/map/location";
import { Good } from "../../engine/state/good";
import {
  HeavyLiftingAction,
  HeavyLiftingData,
} from "../../maps/heavy_cardboard/heavy_lifting";
import { PromiseOr } from "../../utils/types";
import { assertNever } from "../../utils/validate";
import { useConfirm } from "../components/confirm";
import { useAction } from "../services/action";
import { useViewSettings } from "../utils/injection_context";
import { EnhancedMoveData, useMoveOnClick } from "./move_good";

export enum ClickTarget {
  GOOD = 1,
  CITY = 2,
  TOWN = 3,
  LAND = 4,
  INTER_CITY_CONNECTION = 5,
}

type OnGoodClickHandler = (
  space: Space,
  good: Good,
) => PromiseOr<boolean | void>;
type OnCityClickHandler = (city: City) => PromiseOr<boolean | void>;
type OnLandClickHandler = (land: Land) => PromiseOr<boolean | void>;
type OnConnectionClickHandler = () => PromiseOr<boolean | void>;

export interface OnClickRegister {
  (target: ClickTarget.CITY, handler: OnCityClickHandler): void;
  (target: ClickTarget.GOOD, handler: OnGoodClickHandler): void;
  (target: ClickTarget.LAND, handler: OnLandClickHandler): void;
  (target: ClickTarget.TOWN, handler: OnLandClickHandler): void;
  (
    target: ClickTarget.INTER_CITY_CONNECTION,
    handler: OnConnectionClickHandler,
  ): void;
}

type OnClickHandlerTuple =
  | [ClickTarget.CITY, OnCityClickHandler]
  | [ClickTarget.GOOD, OnGoodClickHandler]
  | [ClickTarget.LAND, OnLandClickHandler]
  | [ClickTarget.TOWN, OnLandClickHandler]
  | [ClickTarget.INTER_CITY_CONNECTION, OnConnectionClickHandler];

interface OnClickResponse {
  clickTargets: Set<ClickTarget>;
  onClick(space: Space, good?: Good): Promise<void>;
  onClickInterCity(id: string): void;
}

function useClaim(on: OnClickRegister) {
  const { canEmit, emit, isPending } = useAction(ClaimAction);
  if (canEmit) {
    on(ClickTarget.LAND, (land) => {
      if (!land.getTrack().some((track) => track.isClaimable())) {
        return false;
      }
      emit({ coordinates: land.coordinates });
    });
  }
  return isPending;
}

function useBuildOnClick(on: OnClickRegister) {
  const { canEmit, isPending, setData } = useAction(BuildAction);

  if (canEmit) {
    on(ClickTarget.LAND, (land) => setData({ coordinates: land.coordinates }));
  }
  return isPending;
}

function useHeavyLifting(
  on: OnClickRegister,
  moveActionProgress: EnhancedMoveData | undefined,
) {
  const confirm = useConfirm();
  const { getErrorMessage, emit, canEmit, isPending } =
    useAction(HeavyLiftingAction);
  if (
    canEmit &&
    moveActionProgress != null &&
    moveActionProgress.path!.length === 0
  ) {
    on(ClickTarget.CITY, async (city) => {
      const heavyLiftingData: HeavyLiftingData = {
        startingCity: moveActionProgress.startingCity,
        good: moveActionProgress.good,
        endingCity: city.coordinates,
      };
      if (getErrorMessage(heavyLiftingData) != null) return false;
      if (!(await confirm("Use heavy cardboard move?"))) {
        return false;
      }
      emit(heavyLiftingData);
    });
  }
  return isPending;
}

export type OnClickFunction = (on: OnClickRegister) => boolean;

export function useOnClick(
  moveActionProgress: EnhancedMoveData | undefined,
  setMoveActionProgress: (d: EnhancedMoveData | undefined) => void,
): OnClickResponse {
  const { emit: emitConnectCity, canEmit: canEmitConnectCity } =
    useAction(ConnectCitiesAction);
  const viewSettings = useViewSettings();

  const clickFunctions: OnClickFunction[] = [useClaim, useBuildOnClick];

  if (viewSettings.useOnMapClick) {
    clickFunctions.unshift(viewSettings.useOnMapClick);
  }

  const onClicks: OnClickHandlerTuple[] = [];

  const onClickRegister: OnClickRegister = (target, handler) => {
    onClicks.push([target, handler] as OnClickHandlerTuple);
  };

  // Run all processes first, then check the .some below. We need each function to
  // be called, and a .some or `||` will skip some functions.
  const isPendingArray = clickFunctions.map((fn) => fn(onClickRegister));
  isPendingArray.push(useHeavyLifting(onClickRegister, moveActionProgress));
  isPendingArray.push(
    useMoveOnClick(onClickRegister, moveActionProgress, setMoveActionProgress),
  );
  const isPending = isPendingArray.some((v) => v);

  const clickTargetsNew = new Set(onClicks.map(([target]) => target));
  if (canEmitConnectCity) {
    clickTargetsNew.add(ClickTarget.INTER_CITY_CONNECTION);
  }
  const clickTargets = useMemo(
    () => clickTargetsNew,
    [[...clickTargetsNew].sort().join(":")],
  );

  const checkTarget = (
    space: Space,
    good: Good | undefined,
    [target, onClick]: OnClickHandlerTuple,
  ): PromiseOr<boolean | void> => {
    switch (target) {
      case ClickTarget.GOOD:
        if (good == null) return false;
        return onClick(space, good);
      case ClickTarget.CITY:
        if (!(space instanceof City)) return false;
        return onClick(space);
      case ClickTarget.TOWN:
        if (!(space instanceof Land) || !space.hasTown()) return false;
        return onClick(space);
      case ClickTarget.LAND:
        if (!(space instanceof Land)) return false;
        return onClick(space);
      case ClickTarget.INTER_CITY_CONNECTION:
        return;
      default:
        assertNever(target);
    }
  };

  const onClick = async (space?: Space, good?: Good) => {
    if (space == null || isPending) return;
    for (const onClick of onClicks) {
      if ((await checkTarget(space, good, onClick)) !== false) break;
    }
  };

  const onClickInterCity = useCallback(
    (id: string) => emitConnectCity({ id }),
    [emitConnectCity],
  );

  return { clickTargets, onClick, onClickInterCity };
}
