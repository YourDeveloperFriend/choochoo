import * as React from "react";
import { useCallback } from "react";
import { CheckboxProps, FormCheckbox, Header } from "semantic-ui-react";
import { VariantConfigProps } from "../view_settings";
import { MexicoVariantConfig } from "./variant_config";

export function MexicoVariantEditor({
  config: untypedConfig,
  setConfig,
  isPending,
  errors,
}: VariantConfigProps) {
  const config = untypedConfig as MexicoVariantConfig;

  const setDeterministic = useCallback(
    (_: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
      setConfig({ ...config, deterministicActions: !!data.checked });
    },
    [setConfig, config],
  );

  const setRedBlackProduction = useCallback(
    (_: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
      setConfig({ ...config, redBlackProduction: !!data.checked });
    },
    [setConfig, config],
  );

  const setProductionForAll = useCallback(
    (_: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
      setConfig({ ...config, productionForAll: !!data.checked });
    },
    [setConfig, config],
  );

  return (
    <>
      <Header as="h2">Variants</Header>
      <FormCheckbox
        toggle
        label="Deterministic Disabled Actions"
        checked={config.deterministicActions}
        disabled={isPending}
        onChange={setDeterministic}
        error={errors?.["variant.deterministicActions"]}
      />
      <FormCheckbox
        toggle
        label="Red & Black Production"
        checked={config.redBlackProduction}
        disabled={isPending}
        onChange={setRedBlackProduction}
        error={errors?.["variant.redBlackProduction"]}
      />
      <FormCheckbox
        toggle
        label="Production For All"
        checked={config.productionForAll}
        disabled={isPending}
        onChange={setProductionForAll}
        error={errors?.["variant.productionForAll"]}
      />
    </>
  );
}
