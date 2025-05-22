import { GameKey } from "../api/game_key";
import { MapSettings } from "../engine/game/map_settings";
import { assert } from "../utils/validate";
import { AlabamaRailwaysMapSettings } from "./alabama_railways/settings";
import { CyprusMapSettings } from "./cyprus/settings";
import { DetroitBankruptcyMapSettings } from "./detroit/settings";
import { DiscoInfernoMapSettings } from "./disco/settings";
import { GermanyMapSettings } from "./germany/settings";
import { HeavyCardboardMapSettings } from "./heavy_cardboard/settings";
import { IndiaSteamBrothersMapSettings } from "./india-steam-brothers/settings";
import { IrelandMapSettings } from "./ireland/settings";
import { JamaicaMapSettings } from "./jamaica/settings";
import { KoreaWallaceMapSettings } from "./korea-wallace/settings";
import { MadagascarMapSettings } from "./madagascar/settings";
import { MontrealMetroMapSettings } from "./montreal_metro/settings";
import { MoonMapSettings } from "./moon/settings";
import { NewEnglandMapSettings } from "./new_england/settings";
import { PittsburghMapSettings } from "./pittsburgh/settings";
import { ReversteamMapSettings } from "./reversteam/settings";
import { RustBeltMapSettings } from "./rust_belt/settings";
import { ScandinaviaMapSettings } from "./scandinavia/settings";
import { ScotlandMapSettings } from "./scotland/settings";
import { SicilyMapSettings } from "./sicily/settings";
import { SoulTrainMapSettings } from "./soultrain/settings";
import { StLuciaMapSettings } from "./st-lucia/settings";
import { SwedenRecyclingMapSettings } from "./sweden/settings";

export class MapRegistry {
  static readonly singleton = new MapRegistry();
  private readonly maps = new Map<GameKey, MapSettings>();

  private constructor() {
    this.add(new ScandinaviaMapSettings());
    this.add(new NewEnglandMapSettings());
    this.add(new ScotlandMapSettings());
    this.add(new AlabamaRailwaysMapSettings());
    this.add(new SicilyMapSettings());
    this.add(new RustBeltMapSettings());
    this.add(new ReversteamMapSettings());
    this.add(new IrelandMapSettings());
    this.add(new DiscoInfernoMapSettings());
    this.add(new SwedenRecyclingMapSettings());
    this.add(new CyprusMapSettings());
    this.add(new MadagascarMapSettings());
    this.add(new IndiaSteamBrothersMapSettings());
    this.add(new KoreaWallaceMapSettings());
    this.add(new GermanyMapSettings());
    this.add(new MontrealMetroMapSettings());
    this.add(new SoulTrainMapSettings());
    this.add(new DetroitBankruptcyMapSettings());
    this.add(new StLuciaMapSettings());
    this.add(new PittsburghMapSettings());
    this.add(new JamaicaMapSettings());
    this.add(new MoonMapSettings());
    this.add(new HeavyCardboardMapSettings());
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
