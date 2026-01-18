import { MapViewSettings } from "../view_settings";
import { ChicagoLTextures } from "./rivers";
import { ChicagoLMapSettings } from "./settings";
import { ChicagoLRules } from "./rules";
import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { RepopulateAction } from "./repopulation/repopulate";
import { Phase } from "../../engine/state/phase";
import React from "react";
import { ChicagoLSelectAction } from "./repopulation/action_summary";
import { PlayerData } from "../../engine/state/player";
import { useInjectedState } from "../../client/utils/injection_context";
import { GOVERNMENT_ENGINE_LEVEL } from "./starter";
import { LocoTrack } from "./loco_track";
import { LoopDemandChart } from "./loop_demand_chart";

export class ChicagoLViewSettings
  extends ChicagoLMapSettings
  implements MapViewSettings
{
  getTexturesLayer = ChicagoLTextures;

  getMapRules = ChicagoLRules;

  useOnMapClick = useRepopulateOnClick;

  additionalSliders = [LoopDemandChart, LocoTrack];

  getPlayerStatColumns() {
    return [
      {
        header: "Government Loco",
        cell: GovernmentLocoCell,
      },
    ];
  }

  getActionSummary(
    phase: Phase | undefined,
  ): (() => React.ReactNode) | undefined {
    switch (phase) {
      case Phase.ACTION_SELECTION:
        return ChicagoLSelectAction;
    }
    return undefined;
  }
}

function useRepopulateOnClick(on: OnClickRegister) {
  const { data, canEmit, emit, isPending } = useAction(RepopulateAction);
  const good = data?.good;
  if (canEmit && good != null) {
    on(ClickTarget.CITY, ({ coordinates }) => emit({ good, coordinates }));
  }
  return isPending;
}

function GovernmentLocoCell({ player }: { player: PlayerData }) {
  const govtLocoLevel = useInjectedState(GOVERNMENT_ENGINE_LEVEL);
  const row = govtLocoLevel.get(player.color)!;
  const val = Math.floor((row + 1) / 2);
  return (
    <>
      {val} (Row {row + 1})
    </>
  );
}
