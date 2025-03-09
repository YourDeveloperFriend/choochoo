import * as React from "react";
import { useCallback } from "react";
import { ReversteamVariantConfig } from "../../api/variant_config";
import { VariantConfigProps } from "../view_settings";
import { CheckboxProps, FormCheckbox } from "semantic-ui-react";

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
