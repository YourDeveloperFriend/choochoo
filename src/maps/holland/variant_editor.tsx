import * as React from "react";
import { useCallback } from "react";
import { CheckboxProps, FormCheckbox, Header } from "semantic-ui-react";
import { VariantConfigProps } from "../view_settings";
import { HollandVariantConfig } from "./variant_config";

export function HollandVariantEditor({
  config: untypedConfig,
  setConfig,
  isPending,
  errors,
}: VariantConfigProps) {
  const config = untypedConfig as HollandVariantConfig;

  const setWindmillVariant = useCallback(
    (_: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
      setConfig({ ...config, windmillVariant: !!data.checked });
    },
    [setConfig, config],
  );

  return (
    <>
      <Header as="h2">Variants</Header>
      <FormCheckbox
        toggle
        label="2015 Windmill Variant"
        checked={config.windmillVariant}
        disabled={isPending}
        onChange={setWindmillVariant}
        error={errors?.["variant.windmillVariant"]}
      />
    </>
  );
}
