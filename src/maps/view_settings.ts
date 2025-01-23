import { ReactNode } from "react";
import { MapSettings } from "../engine/game/map_settings";
import { Action } from "../engine/state/action";


export interface MapViewSettings extends MapSettings {
  readonly key: string;

  getMapRules(): ReactNode;
  getActionDescription?(action: Action): string | undefined;
}