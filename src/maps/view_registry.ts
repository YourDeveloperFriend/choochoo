import { GameKey } from "../api/game_key";
import { assert } from "../utils/validate";
import { CyprusViewSettings } from "./cyprus/view_settings";
import { DetroitBankruptcyViewSettings } from "./detroit/view_settings";
import { GermanyViewSettings } from "./germany/view_settings";
import { IndiaViewSettings } from "./india/view_settings";
import { IrelandViewSettings } from "./ireland/view_settings";
import { KoreaViewSettings } from "./korea/view_settings";
import { MadagascarViewSettings } from "./madagascar/view_settings";
import { ReversteamViewSettings } from "./reversteam/view_settings";
import { RustBeltViewSettings } from "./rust_belt/view_settings";
import { SwedenRecyclingViewSettings } from "./sweden/view_settings";
import { MapViewSettings } from "./view_settings";

export class ViewRegistry {
  static readonly singleton = new ViewRegistry();
  private readonly maps = new Map<GameKey, MapViewSettings>();

  private constructor() {
    this.add(new RustBeltViewSettings());
    this.add(new ReversteamViewSettings());
    this.add(new IrelandViewSettings());
    this.add(new SwedenRecyclingViewSettings());
    this.add(new CyprusViewSettings());
    this.add(new MadagascarViewSettings());
    this.add(new IndiaViewSettings());
    this.add(new KoreaViewSettings());
    this.add(new GermanyViewSettings());
    this.add(new DetroitBankruptcyViewSettings());
  }

  values(): Iterable<MapViewSettings> {
    return this.maps.values();
  }

  add(map: MapViewSettings): void {
    assert(!this.maps.has(map.key), `duplicate maps with key ${map.key}`);
    this.maps.set(map.key, map);
  }

  get(key: GameKey): MapViewSettings {
    assert(this.maps.has(key), `unfound maps with key ${key}`);
    return this.maps.get(key)!;
  }
}
