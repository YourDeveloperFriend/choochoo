import { MapViewSettings } from "../view_settings";
import { UnionPacificExpressMapSettings } from "./settings";
import { UnionPacificExpressRules } from "./rules";

export class UnionPacificExpressViewSettings
  extends UnionPacificExpressMapSettings
  implements MapViewSettings
{
  getMapRules = UnionPacificExpressRules;
}
