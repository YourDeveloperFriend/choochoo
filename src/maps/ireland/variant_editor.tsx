import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
} from "@mui/material";
import { ChangeEvent, useCallback } from "react";
import { IrelandVariantConfig } from "../../api/variant_config";
import { VariantConfigProps } from "../view_settings";

export function IrelandVariantEditor({
  config: untypedConfig,
  setConfig,
  isPending,
  errors,
}: VariantConfigProps) {
  const config = untypedConfig as IrelandVariantConfig;

  const setConfigInternal = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setConfig({ ...config, locoVariant: e.target.checked });
    },
    [setConfig, config],
  );

  return (
    <FormControl error={errors?.["variant.locoVariant"] != null}>
      <FormControlLabel
        sx={{ m: 1, minWidth: 80 }}
        label="Loco Variant"
        control={
          <Checkbox
            checked={config.locoVariant}
            value={config.locoVariant}
            disabled={isPending}
            onChange={setConfigInternal}
          />
        }
      />
      <FormHelperText>{errors?.["variant.locoVariant"]}</FormHelperText>
    </FormControl>
  );
}
