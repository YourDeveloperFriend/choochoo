import { MapViewSettings } from "../view_settings";
import * as hexStyles from "../../client/grid/hex.module.css";
import * as landStyles from "./land_styles.module.css";
import { GOLF_STYLE, PARK_STYLE, WATER_STYLE } from "./grid";
import React from "react";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useConfirm } from "../../client/components/confirm";
import { useAction } from "../../client/services/action";
import { useGrid } from "../../client/utils/injection_context";
import { goodToString } from "../../engine/state/good";
import { City } from "../../engine/map/city";
import { Phase } from "../../engine/state/phase";
import { StrollAction } from "./stroll";
import { PittsburghMetroSpecialActionSelector } from "./stroll_summary";
import { PittsburghMetroRules } from "./rules";
import { MunicipalDevelopment } from "./municipal_development_slider";
import {
  PittsburghMetroOverlayLayer,
  PittsburghMetroTextures,
} from "./textures";
import { PittsburghMetroMapSettings } from "./settings";

export class PittsburghMetroViewSettings
  extends PittsburghMetroMapSettings
  implements MapViewSettings
{
  publisher = {
    name: "Neon Comet Games",
    role: "Developed and published by",
    logoSrc: "/static/ncg_logo.svg",
    purchaseUrl: "https://neoncometgames.com/product/spring-2026-aos-set/",
  };
  getMapRules = PittsburghMetroRules;
  getTexturesLayer = PittsburghMetroTextures;
  getOverlayLayer = PittsburghMetroOverlayLayer;
  additionalSliders = [MunicipalDevelopment];

  getLandStyles = () => ({
    [GOLF_STYLE]: landStyles.golf,
    [PARK_STYLE]: hexStyles.mountain,
    [WATER_STYLE]: hexStyles.water,
  });

  getActionSummary(
    phase: Phase | undefined,
  ): (() => React.ReactNode) | undefined {
    if (phase === Phase.ACTION_SELECTION) {
      return PittsburghMetroSpecialActionSelector;
    }
    return undefined;
  }

  useOnMapClick = useStrollOnClick;
}

function useStrollOnClick(on: OnClickRegister) {
  const {
    canEmit,
    data,
    setData,
    clearData,
    emit,
    getErrorMessage,
    isPending,
  } = useAction(StrollAction);
  const confirm = useConfirm();
  const grid = useGrid();
  if (canEmit) {
    // Clicking a cube (re)selects the origin city and the cube color.
    on(ClickTarget.GOOD, (space, good) => {
      if (!(space instanceof City)) {
        return false;
      }
      setData({ from: space.coordinates, good });
    });
    if (data?.from != null && data.good != null) {
      const { from, good } = data;
      // Clicking a city picks the destination, which is confirmed in a modal.
      on(ClickTarget.CITY, async ({ coordinates: to }) => {
        if (getErrorMessage({ from, good, to }) != null) {
          return false;
        }
        const message = `Move a ${goodToString(good)} cube from ${grid.displayName(from)} to ${grid.displayName(to)}?`;
        if (await confirm(message)) {
          emit({ from, good, to });
        } else {
          clearData();
        }
      });
    }
  }
  return isPending;
}
