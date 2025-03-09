import * as React from "react";
import { useCallback } from "react";
import { IrelandVariantConfig } from "../../api/variant_config";
import { VariantConfigProps } from "../view_settings";
import { CheckboxProps, FormCheckbox } from "semantic-ui-react";

export function IrelandVariantEditor({
  config: untypedConfig,
  setConfig,
  isPending,
  errors,
}: VariantConfigProps) {
  const config = untypedConfig as IrelandVariantConfig;

  const setConfigInternal = useCallback(
    (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
      setConfig({ ...config, locoVariant: !!data.checked });
    },
    [setConfig, config],
  );

  return (
    <FormCheckbox
      toggle
      label="Loco Variant"
      checked={config.locoVariant}
      disabled={isPending}
      onChange={setConfigInternal}
      error={errors?.["variant.locoVariant"]}
    />
  );
}
