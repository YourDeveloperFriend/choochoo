import { GameKey } from "../api/game_key";
import { assert } from "../utils/validate";
import { allViewSettings } from "choochoo:view-registry";
import { MapViewSettings } from "./view_settings";

export class ViewRegistry {
  static readonly singleton = new ViewRegistry();
  private readonly maps = new Map<GameKey, MapViewSettings>();

  private constructor() {
    for (const settings of allViewSettings) {
      assert(
        !this.maps.has(settings.key),
        `duplicate maps with key ${settings.key}`,
      );
      this.maps.set(settings.key, settings);
    }
  }

  values(): Iterable<MapViewSettings> {
    return this.maps.values();
  }

  get(key: GameKey): MapViewSettings {
    assert(this.maps.has(key), `unfound maps with key ${key}`);
    return this.maps.get(key)!;
  }
}
