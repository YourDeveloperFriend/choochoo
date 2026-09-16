import * as React from "react";
import { useCallback } from "react";
import { CheckboxProps, FormCheckbox, Header } from "semantic-ui-react";
import { VariantConfigProps } from "../view_settings";
import { ScotlandVariantConfig } from "./variant_config";

export function ScotlandVariantEditor({
  config: untypedConfig,
  setConfig,
  isPending,
  errors,
}: VariantConfigProps) {
  const config = untypedConfig as ScotlandVariantConfig;

  const setSmallerBag = useCallback(
    (_: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
      setConfig({ ...config, smallerBag: !!data.checked });
    },
    [setConfig, config],
  );

  return (
    <>
      <Header as="h2">Variants</Header>
      <FormCheckbox
        toggle
        label="Smaller Bag"
        checked={config.smallerBag}
        disabled={isPending}
        onChange={setSmallerBag}
        error={errors?.["variant.smallerBag"]}
      />
    </>
  );
}
