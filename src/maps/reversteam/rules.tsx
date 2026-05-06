import { ReversteamVariantConfig } from "./variant_config";
import { RulesProps } from "../view_settings";

export function ReversteamRules({ variant }: RulesProps) {
  const typed = variant as ReversteamVariantConfig;
  if (typed.baseRules) {
    return (
      <p>
        No changes from base game. No seriously, this is just the base game
        rules on the Reversteam map.
      </p>
    );
  }
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Cities:</b> accept goods of anything except their own color.
        </li>
        <li>
          <b>Black cities:</b> accept no goods.
        </li>
      </ul>
    </div>
  );
}
