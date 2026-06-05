import React from "react";
import { VariantConfig } from "../../api/variant_config";
import { CyprusVariantConfig } from "./variant_config";
import { MapViewSettings } from "../view_settings";
import { CyprusRules } from "./rules";
import { CyprusMapSettings } from "./settings";
import { CyprusVariantEditor } from "./variant_editor";
import { Phase } from "../../engine/state/phase";
import { CyprusRoleSelectionSummary } from "./action_summary";

export class CyprusViewSettings
  extends CyprusMapSettings
  implements MapViewSettings
{
  getMapRules = CyprusRules;

  getInitialVariantConfig(): VariantConfig {
    return { variant2020: true };
  }
  getVariantConfigEditor = CyprusVariantEditor;

  getVariantString(variant: VariantConfig): string[] | undefined {
    return [(variant as CyprusVariantConfig).variant2020 ? "2020" : "2012"];
  }

  getActionSummary(
    phase: Phase | undefined,
  ): (() => React.ReactNode) | undefined {
    if (phase === Phase.ROLE_SELECTION) {
      return CyprusRoleSelectionSummary;
    }
    return undefined;
  }
}
