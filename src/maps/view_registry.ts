import { GameKey } from "../api/game_key";
import { assert } from "../utils/validate";
import { CyprusViewSettings } from "./cyprus/view_settings";
import { DetroitBankruptcyViewSettings } from "./detroit/view_settings";
import { DiscoInfernoViewSettings } from "./disco/view_settings";
import { GermanyViewSettings } from "./germany/view_settings";
import { HeavyCardboardViewSettings } from "./heavy_cardboard/view_settings";
import { IndiaSteamBrothersViewSettings } from "./india-steam-brothers/view_settings";
import { IrelandViewSettings } from "./ireland/view_settings";
import { JamaicaViewSettings } from "./jamaica/view_settings";
import { KoreaWallaceViewSettings } from "./korea-wallace/view_settings";
import { MadagascarViewSettings } from "./madagascar/view_settings";
import { MoonViewSettings } from "./moon/view_settings";
import { PittsburghViewSettings } from "./pittsburgh/view_settings";
import { ReversteamViewSettings } from "./reversteam/view_settings";
import { RustBeltViewSettings } from "./rust_belt/view_settings";
import { SoulTrainViewSettings } from "./soultrain/view_settings";
import { StLuciaViewSettings } from "./st-lucia/view_settings";
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
    this.add(new SoulTrainViewSettings());
    this.add(new DiscoInfernoViewSettings());
    this.add(new CyprusViewSettings());
    this.add(new MadagascarViewSettings());
    this.add(new IndiaSteamBrothersViewSettings());
    this.add(new KoreaWallaceViewSettings());
    this.add(new GermanyViewSettings());
    this.add(new DetroitBankruptcyViewSettings());
    this.add(new StLuciaViewSettings());
    this.add(new PittsburghViewSettings());
    this.add(new JamaicaViewSettings());
    this.add(new MoonViewSettings());
    this.add(new HeavyCardboardViewSettings());
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
