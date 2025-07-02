import { ReactElement, ReactNode } from "react";
import { VariantConfig } from "../api/variant_config";
import { RowFactory } from "../client/game/final_overview_row";
import { ClickTarget, OnClickFunction } from "../client/grid/click_target";
import { MapSettings } from "../engine/game/map_settings";
import { Grid } from "../engine/map/grid";
import { InterceptMoveModalProps } from "../engine/move/interceptor";
import { Action } from "../engine/state/action";
import { Phase } from "../engine/state/phase";

export interface VariantConfigProps {
  config: Partial<VariantConfig>;
  isPending: boolean;
  setConfig: (c: VariantConfig) => void;
  errors?: Record<string, string>;
}

export interface RulesProps {
  variant: VariantConfig;
}

export interface TexturesProps {
  grid: Grid;
  size: number;
  clickTargets?: Set<ClickTarget>;
}

export interface MapViewSettings extends MapSettings {
  getInitialVariantConfig?(): VariantConfig;
  getVariantConfigEditor?(props: VariantConfigProps): ReactNode;

  additionalSliders?: Array<() => ReactElement>;
  getVariantString?(variant: VariantConfig): string[] | undefined;
  getMapRules(props: RulesProps): ReactElement;
  getTexturesLayer?(props: TexturesProps): ReactNode;
  getOverlayLayer?(props: TexturesProps): ReactNode;
  getFinalOverviewRows?(): RowFactory[];
  getActionCaption?(action: Action): string[] | string | undefined;
  moveGoodsMessage?(): string | undefined;
  moveInterceptModal?(props: InterceptMoveModalProps): ReactNode;
  getActionSummary?(phase: Phase | undefined): undefined | (() => ReactNode);
  useOnMapClick?: OnClickFunction;
}
