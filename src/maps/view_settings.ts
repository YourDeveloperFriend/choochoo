import { ReactElement, ReactNode } from "react";
import { VariantConfig } from "../api/variant_config";
import { RowFactory } from "../client/game/final_overview_row";
import { MapSettings } from "../engine/game/map_settings";
import { Action } from "../engine/state/action";

export interface VariantConfigProps {
  config: Partial<VariantConfig>;
  isPending: boolean;
  setConfig: (c: VariantConfig) => void;
  errors?: Record<string, string>;
}

export interface RulesProps {
  variant: VariantConfig;
}

export interface MapViewSettings extends MapSettings {
  getInitialVariantConfig?(): VariantConfig;
  getVariantConfigEditor?(props: VariantConfigProps): ReactNode;

  getVariantString?(variant: VariantConfig): string[] | undefined;
  getMapRules(props: RulesProps): ReactElement;
  getActionDescription?(action: Action): string | undefined;
  getTexturesLayer?(): ReactNode;
  getFinalOverviewRows?(): RowFactory[];
  getActionCaption?(action: Action): string | undefined;
}
