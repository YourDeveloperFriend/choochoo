import { PlayerData } from "../../engine/state/player";
import { MapViewSettings } from "../view_settings";
import { NewEnglandRules } from "./rules";
import { NewEnglandMapSettings } from "./settings";

export class NewEnglandViewSettings
  extends NewEnglandMapSettings
  implements MapViewSettings
{
  getMapRules = NewEnglandRules;
  useScoreBreakdownItems = useNewEnglandScoreBreakdown;
}

export function useNewEnglandScoreBreakdown(
  player: PlayerData,
): Array<{ label: string; value: number }> {
  const bonus = Math.floor(player.money / 20);

  if (bonus === 0) return [];
  return [{ label: `Money bonus ($${player.money} ÷ 20):`, value: bonus }];
}
