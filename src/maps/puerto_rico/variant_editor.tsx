import { useCallback } from "react";
import { DropdownProps, FormDropdown } from "semantic-ui-react";
import { PuertoRicoVariantConfig } from "../../api/variant_config";
import { VariantConfigProps } from "../view_settings";
import { DIFFICULTY_OPTIONS, type DifficultyLevel } from "./difficulty_levels";

export function PuertoRicoVariantEditor({
  config: untypedConfig,
  setConfig,
  isPending,
  errors,
}: VariantConfigProps) {
  const config = untypedConfig as PuertoRicoVariantConfig;

  const setDifficulty = useCallback(
    (event: React.SyntheticEvent, data: DropdownProps) => {
      setConfig({ ...config, difficulty: data.value as DifficultyLevel });
    },
    [setConfig, config],
  );

  return (
    <FormDropdown
      label="Difficulty Level"
      selection
      options={DIFFICULTY_OPTIONS}
      value={config.difficulty}
      disabled={isPending}
      onChange={setDifficulty}
      error={errors?.["variant.difficulty"]}
    />
  );
}
