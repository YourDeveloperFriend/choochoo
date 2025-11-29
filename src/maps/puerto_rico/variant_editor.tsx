import { useCallback } from "react";
import { DropdownProps, FormDropdown } from "semantic-ui-react";
import { PuertoRicoVariantConfig } from "../../api/variant_config";  // Change this import
import { VariantConfigProps } from "../view_settings";

type DifficultyLevel = 'novicio' | 'estudiante' | 'versado' | 'maestro' | 'conquistador' | 'dios';

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
      options={[
        { text: 'Novicio', value: 'novicio' },
        { text: 'Estudiante', value: 'estudiante' },
        { text: 'Versado', value: 'versado' },
        { text: 'Maestro', value: 'maestro' },
        { text: 'Conquistador', value: 'conquistador' },
        { text: 'Dios', value: 'dios' },
      ]}
      value={config.difficulty}
      disabled={isPending}
      onChange={setDifficulty}
      error={errors?.["variant.difficulty"]}
    />
  );
}