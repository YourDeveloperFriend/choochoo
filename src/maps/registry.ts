import { GameKey } from "../api/game_key";
import { MapSettings } from "../engine/game/map_settings";
import { assert } from "../utils/validate";
import { CyprusMapSettings } from "./cyprus/settings";
import { DetroitBankruptcyMapSettings } from "./detroit/settings";
import { GermanyMapSettings } from "./germany/settings";
import { IndiaSteamBrothersMapSettings } from "./india-steam-brothers/settings";
import { IrelandMapSettings } from "./ireland/settings";
import { KoreaWallaceMapSettings } from "./korea-wallace/settings";
import { MadagascarMapSettings } from "./madagascar/settings";
import { ReversteamMapSettings } from "./reversteam/settings";
import { RustBeltMapSettings } from "./rust_belt/settings";
import { SwedenRecyclingMapSettings } from "./sweden/settings";

export class MapRegistry {
  static readonly singleton = new MapRegistry();
  private readonly maps = new Map<GameKey, MapSettings>();

  private constructor() {
    this.add(new RustBeltMapSettings());
    this.add(new ReversteamMapSettings());
    this.add(new IrelandMapSettings());
    this.add(new SwedenRecyclingMapSettings());
    this.add(new CyprusMapSettings());
    this.add(new MadagascarMapSettings());
    this.add(new IndiaSteamBrothersMapSettings());
    this.add(new KoreaWallaceMapSettings());
    this.add(new GermanyMapSettings());
    this.add(new DetroitBankruptcyMapSettings());
  }

  values(): Iterable<MapSettings> {
    return this.maps.values();
  }

  add(map: MapSettings): void {
    assert(!this.maps.has(map.key), `duplicate maps with key ${map.key}`);
    this.maps.set(map.key, map);
  }

  get(key: GameKey): MapSettings {
    assert(this.maps.has(key), `unfound maps with key ${key}`);
    return this.maps.get(key)!;
  }
}
