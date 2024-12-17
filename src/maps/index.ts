
import { MapSettings } from '../engine/game/map_settings';
import { assert } from '../utils/validate';
import { IrelandMapSettings } from './ireland/settings';
import { ReversteamMapSettings } from './reversteam/settings';
import { RustBeltMapSettings } from './rust_belt/settings';
import { SwedenRecyclingMapSettings } from './sweden/settings';


export class MapRegistry {
  static readonly singleton = new MapRegistry();
  private readonly maps = new Map<string, MapSettings>();

  private constructor() {
    this.add(new RustBeltMapSettings());
    this.add(new ReversteamMapSettings());
    this.add(new IrelandMapSettings());
    this.add(new SwedenRecyclingMapSettings());
  }

  values(): Iterable<MapSettings> {
    return this.maps.values();
  }

  add(map: MapSettings): void {
    assert(!this.maps.has(map.key), `duplicate maps with key ${map.key}`);
    this.maps.set(map.key, map);
  }

  get(key: string): MapSettings {
    assert(this.maps.has(key), `unfound maps with key ${key}`);
    return this.maps.get(key)!;
  }
}
