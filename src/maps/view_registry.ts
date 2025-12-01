import { SouthernUsViewSettings } from "./southern_us/view_settings";
import { FourCornersViewSettings } from "./four_corners/view_settings";
import { BarbadosViewSettings } from "./barbados/view_settings";
import { GameKey } from "../api/game_key";
import { assert } from "../utils/validate";
import { AlabamaRailwaysViewSettings } from "./alabama_railways/view_settings";
import { AustraliaViewSettings } from "./australia/view_settings";
import { BalkanViewSettings } from "./balkan/view_settings";
import { ChesapeakeAndOhioViewSettings } from "./chesapeake-and-ohio/view_settings";
import { CyprusViewSettings } from "./cyprus/view_settings";
import { DCMetroViewSettings } from "./dc_metro/view_settings";
import { DenmarkViewSettings } from "./denmark/view_settings";
import { DetroitBankruptcyViewSettings } from "./detroit/view_settings";
import { DiscoInfernoViewSettings } from "./disco/view_settings";
import { GermanyViewSettings } from "./germany/view_settings";
import { HeavyCardboardViewSettings } from "./heavy_cardboard/view_settings";
import { IndiaSteamBrothersViewSettings } from "./india-steam-brothers/view_settings";
import { IrelandViewSettings } from "./ireland/view_settings";
import { JamaicaViewSettings } from "./jamaica/view_settings";
import { KoreaWallaceViewSettings } from "./korea-wallace/view_settings";
import { LondonViewSettings } from "./london/view_settings";
import { MadagascarViewSettings } from "./madagascar/view_settings";
import { MontrealMetroViewSettings } from "./montreal_metro/view_settings";
import { MoonViewSettings } from "./moon/view_settings";
import { NewEnglandViewSettings } from "./new_england/view_settings";
import { PittsburghViewSettings } from "./pittsburgh/view_settings";
import { PolandViewSettings } from "./poland/view_settings";
import { PortugalViewSettings } from "./portugal/view_settings";
import { ReversteamViewSettings } from "./reversteam/view_settings";
import { RustBeltViewSettings } from "./rust_belt/view_settings";
import { ScandinaviaViewSettings } from "./scandinavia/view_settings";
import { ScotlandViewSettings } from "./scotland/view_settings";
import { SicilyViewSettings } from "./sicily/view_settings";
import { SoulTrainViewSettings } from "./soultrain/view_settings";
import { StLuciaViewSettings } from "./st-lucia/view_settings";
import { SwedenRecyclingViewSettings } from "./sweden/view_settings";
import { TrislandViewSettings } from "./trisland/view_settings";
import { MapViewSettings } from "./view_settings";
import { CaliforniaGoldRushViewSettings } from "./ca-gold-rush/view_settings";
import { UnionPacificExpressViewSettings } from "./union_pacific_express/view_settings";
import { RustBeltExpressViewSettings } from "./rust_belt_express/view_settings";
import { ChicagoSpeakeasyViewSettings } from "./chicago_speakeasy/view_settings";
import { BelgiumViewSettings } from "./belgium/view_settings";
import { EasternUsAndCanadaViewSettings } from "./eastern_us_and_canada/view_settings";
import { DoubleBaseUsaViewSettings } from "./double_base_usa/view_settings";

export class ViewRegistry {
  static readonly singleton = new ViewRegistry();
  private readonly maps = new Map<GameKey, MapViewSettings>();

  private constructor() {
    this.add(new SouthernUsViewSettings());
    this.add(new FourCornersViewSettings());
    this.add(new BarbadosViewSettings());
    this.add(new TrislandViewSettings());
    this.add(new PortugalViewSettings());
    this.add(new AustraliaViewSettings());
    this.add(new ScotlandViewSettings());
    this.add(new DCMetroViewSettings());
    this.add(new ScandinaviaViewSettings());
    this.add(new NewEnglandViewSettings());
    this.add(new AlabamaRailwaysViewSettings());
    this.add(new SicilyViewSettings());
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
    this.add(new LondonViewSettings());
    this.add(new GermanyViewSettings());
    this.add(new DetroitBankruptcyViewSettings());
    this.add(new StLuciaViewSettings());
    this.add(new PittsburghViewSettings());
    this.add(new JamaicaViewSettings());
    this.add(new MoonViewSettings());
    this.add(new HeavyCardboardViewSettings());
    this.add(new MontrealMetroViewSettings());
    this.add(new DenmarkViewSettings());
    this.add(new ChesapeakeAndOhioViewSettings());
    this.add(new BalkanViewSettings());
    this.add(new PolandViewSettings());
    this.add(new CaliforniaGoldRushViewSettings());
    this.add(new UnionPacificExpressViewSettings());
    this.add(new RustBeltExpressViewSettings());
    this.add(new ChicagoSpeakeasyViewSettings());
    this.add(new BelgiumViewSettings());
    this.add(new EasternUsAndCanadaViewSettings());
    this.add(new DoubleBaseUsaViewSettings());
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
