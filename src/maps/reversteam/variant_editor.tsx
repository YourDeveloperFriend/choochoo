import { useCallback } from "react";
import { ReversteamVariantConfig } from "../../api/variant_config";
import { VariantConfigProps } from "../view_settings";
import { FormCheckbox } from "semantic-ui-react";
import * as React from "react";
import { CheckboxProps } from "semantic-ui-react/dist/commonjs/modules/Checkbox/Checkbox";

export function ReversteamVariantEditor({
  config: untypedConfig,
  setConfig,
  isPending,
  errors,
}: VariantConfigProps) {
  const config = untypedConfig as ReversteamVariantConfig;

  const setConfigInternal = useCallback(
    (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
      setConfig({ ...config, baseRules: !!data.checked });
    },
    [setConfig, config],
  );

  return (
    <FormCheckbox
      toggle
      label="Use base map rules (not reversed)"
      checked={config.baseRules}
      disabled={isPending}
      onChange={setConfigInternal}
      error={errors?.["variant.baseRules"]}
    />
  );
}
