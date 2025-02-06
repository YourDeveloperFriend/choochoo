import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { useCallback } from "react";
import { CyprusVariantConfig } from "../../api/variant_config";
import { VariantConfigProps } from "../view_settings";

export function CyprusVariantEditor({
  config: untypedConfig,
  setConfig,
  isPending,
  errors,
}: VariantConfigProps) {
  const config = untypedConfig as CyprusVariantConfig;

  const setVersion = useCallback(
    (e: SelectChangeEvent<2012 | 2020>) => {
      setConfig({
        ...config,
        version: typeof e.target.value === "number" ? e.target.value : 2020,
      });
    },
    [setConfig, config],
  );

  return (
    <FormControl
      sx={{ m: 1, minWidth: 80 }}
      error={errors?.["variant.version"] != null}
    >
      <InputLabel>Version</InputLabel>
      <Select
        required
        value={config.version}
        disabled={isPending}
        onChange={setVersion}
        error={errors?.["variant.version"] != null}
        autoWidth
        label="Version"
      >
        <MenuItem value={2012}>2012</MenuItem>
        <MenuItem value={2020}>2020</MenuItem>
      </Select>
      {errors?.["variant.version"] && (
        <FormHelperText>{errors?.["variant.version"]}</FormHelperText>
      )}
    </FormControl>
  );
}
