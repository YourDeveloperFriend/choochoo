import { SouthernUsMapSettings } from "./southern_us/settings";
import { FourCornersMapSettings } from "./four_corners/settings";
import { BarbadosMapSettings } from "./barbados/settings";
import { GameKey } from "../api/game_key";
import { MapSettings } from "../engine/game/map_settings";
import { assert } from "../utils/validate";
import { AlabamaRailwaysMapSettings } from "./alabama_railways/settings";
import { AustraliaMapSettings } from "./australia/settings";
import { BalkanMapSettings } from "./balkan/settings";
import { ChesapeakeAndOhioMapSettings } from "./chesapeake-and-ohio/settings";
import { CyprusMapSettings } from "./cyprus/settings";
import { DCMetroMapSettings } from "./dc_metro/settings";
import { DenmarkMapSettings } from "./denmark/settings";
import { DetroitBankruptcyMapSettings } from "./detroit/settings";
import { DiscoInfernoMapSettings } from "./disco/settings";
import { GermanyMapSettings } from "./germany/settings";
import { HeavyCardboardMapSettings } from "./heavy_cardboard/settings";
import { IndiaSteamBrothersMapSettings } from "./india-steam-brothers/settings";
import { IrelandMapSettings } from "./ireland/settings";
import { JamaicaMapSettings } from "./jamaica/settings";
import { KoreaWallaceMapSettings } from "./korea-wallace/settings";
import { LondonMapSettings } from "./london/settings";
import { MadagascarMapSettings } from "./madagascar/settings";
import { MontrealMetroMapSettings } from "./montreal_metro/settings";
import { MoonMapSettings } from "./moon/settings";
import { NewEnglandMapSettings } from "./new_england/settings";
import { PittsburghMapSettings } from "./pittsburgh/settings";
import { PolandMapSettings } from "./poland/settings";
import { PortugalMapSettings } from "./portugal/settings";
import { ReversteamMapSettings } from "./reversteam/settings";
import { RustBeltMapSettings } from "./rust_belt/settings";
import { ScandinaviaMapSettings } from "./scandinavia/settings";
import { ScotlandMapSettings } from "./scotland/settings";
import { SicilyMapSettings } from "./sicily/settings";
import { SoulTrainMapSettings } from "./soultrain/settings";
import { StLuciaMapSettings } from "./st-lucia/settings";
import { SwedenRecyclingMapSettings } from "./sweden/settings";
import { TrislandMapSettings } from "./trisland/settings";
import { CaliforniaGoldRushMapSettings } from "./ca-gold-rush/settings";
import { UnionPacificExpressMapSettings } from "./union_pacific_express/settings";
import { RustBeltExpressMapSettings } from "./rust_belt_express/settings";
import { ChicagoSpeakeasyMapSettings } from "./chicago_speakeasy/settings";
import { BelgiumMapSettings } from "./belgium/settings";
import { EasternUsAndCanadaMapSettings } from "./eastern_us_and_canada/settings";

export class MapRegistry {
  static readonly singleton = new MapRegistry();
  private readonly maps = new Map<GameKey, MapSettings>();

  private constructor() {
    this.add(new SouthernUsMapSettings());
    this.add(new FourCornersMapSettings());
    this.add(new BarbadosMapSettings());
    this.add(new TrislandMapSettings());
    this.add(new PortugalMapSettings());
    this.add(new AustraliaMapSettings());
    this.add(new DCMetroMapSettings());
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
    this.add(new LondonMapSettings());
    this.add(new GermanyMapSettings());
    this.add(new MontrealMetroMapSettings());
    this.add(new SoulTrainMapSettings());
    this.add(new DetroitBankruptcyMapSettings());
    this.add(new StLuciaMapSettings());
    this.add(new PolandMapSettings());
    this.add(new BalkanMapSettings());
    this.add(new PittsburghMapSettings());
    this.add(new JamaicaMapSettings());
    this.add(new MoonMapSettings());
    this.add(new HeavyCardboardMapSettings());
    this.add(new DenmarkMapSettings());
    this.add(new ChesapeakeAndOhioMapSettings());
    this.add(new CaliforniaGoldRushMapSettings());
    this.add(new UnionPacificExpressMapSettings());
    this.add(new RustBeltExpressMapSettings());
    this.add(new ChicagoSpeakeasyMapSettings());
    this.add(new BelgiumMapSettings());
    this.add(new EasternUsAndCanadaMapSettings());
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
