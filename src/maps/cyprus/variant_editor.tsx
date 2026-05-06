import { useCallback } from "react";
import { CheckboxProps, FormCheckbox } from "semantic-ui-react";
import { CyprusVariantConfig } from "./variant_config";
import { VariantConfigProps } from "../view_settings";

export function CyprusVariantEditor({
  config: untypedConfig,
  setConfig,
  isPending,
  errors,
}: VariantConfigProps) {
  const config = untypedConfig as CyprusVariantConfig;

  const setConfigInternal = useCallback(
    (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
      setConfig({ ...config, variant2020: !!data.checked });
    },
    [setConfig, config],
  );

  return (
    <FormCheckbox
      toggle
      label="Use 2020 rules"
      checked={config.variant2020}
      disabled={isPending}
      onChange={setConfigInternal}
      error={errors?.["variant.variant2020"]}
    />
  );
}
