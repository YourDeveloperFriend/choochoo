import { readdirSync } from "fs";
import { join } from "path";
import { GameKey } from "../api/game_key";
import { MapSettings } from "../engine/game/map_settings";
import { assert } from "../utils/validate";

export class MapRegistry {
  static readonly singleton = new MapRegistry();
  private readonly maps = new Map<GameKey, MapSettings>();

  private constructor() {
    for (const entry of readdirSync(__dirname, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === "template") continue;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require(join(__dirname, entry.name, "settings")) as {
          mapSettings?: MapSettings;
        };
        if (mod.mapSettings != null) {
          this.add(mod.mapSettings);
        }
      } catch {
        // Not a map directory
      }
    }
  }

  values(): Iterable<MapSettings> {
    return this.maps.values();
  }

  get(key: GameKey): MapSettings {
    assert(this.maps.has(key), `unfound maps with key ${key}`);
    return this.maps.get(key)!;
  }

  private add(map: MapSettings): void {
    assert(!this.maps.has(map.key), `duplicate maps with key ${map.key}`);
    this.maps.set(map.key, map);
  }
}
