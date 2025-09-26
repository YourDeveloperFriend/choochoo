import { MapViewSettings } from "../view_settings";
import { RustBeltExpressMapSettings } from "./settings";
import { RustBeltExpressRules } from "./rules";

export class RustBeltExpressViewSettings
  extends RustBeltExpressMapSettings
  implements MapViewSettings
{
  getMapRules = RustBeltExpressRules;
}
