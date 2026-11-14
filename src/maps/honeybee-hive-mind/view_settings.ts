import { HoneybeeCity } from "./city_visuals";
import { HoneybeeCityGoods } from "./city_goods";
import { honeybeeGoodsTableVisual } from "./goods_table";
import { WAGGLE_DANCE_PHASE } from "./phases";
import {
  WaggleControls,
  WaggleOverlay,
  WaggleSummary,
  useWaggleMapClick,
} from "./waggle_view";
import { HoneybeeRouteFee } from "./route_fee";
import { HoneybeeLogText } from "./log";
import { HoneybeeCostLegend } from "./cost_legend";
import { MapViewSettings } from "../view_settings";
import { HoneybeeHiveMindMapSettings } from "./settings";
import { HoneybeeHiveMindRules } from "./rules";
import { HoneybeeMoveInterceptModal } from "./move_intercept_modal";
import { HoneybeeBuildSummary } from "./build_summary";
import { WagglePreviewProvider } from "./waggle_preview";
import { honeybeeInterurbanPosition } from "./interurban_layout";
import { beeFee } from "./move";
import { Phase } from "../../engine/state/phase";
import * as styles from "./grid.module.css";

export class HoneybeeHiveMindViewSettings
  extends HoneybeeHiveMindMapSettings
  implements MapViewSettings
{
  getMapRules = HoneybeeHiveMindRules;
  renderCity = HoneybeeCity;
  renderCityGoods = HoneybeeCityGoods;
  getGoodsTableVisual = honeybeeGoodsTableVisual;
  renderLogText = HoneybeeLogText;
  publisher = {
    name: "Neon Comet Games",
    role: "Published by",
    logoSrc: "/static/ncg_logo.svg",
    purchaseUrl: "https://neoncometgames.com/product/2023-map-set/",
  };
  getLandStyles() {
    return styles;
  }
  readonly interCityConnectionScale = 0.5;
  readonly interCityConnectionFillOpacity = 0.35;

  getOverlayLayer = HoneybeeCostLegend;
  getMoveRouteOverlay = HoneybeeRouteFee;
  getGameMapOverlay = WaggleOverlay;
  getGameMapControls = WaggleControls;
  gameMapWrapper = WagglePreviewProvider;
  useOnMapClick = useWaggleMapClick;
  getInterCityConnectionPosition = honeybeeInterurbanPosition;
  getMoveCost = beeFee;
  moveInterceptModal = HoneybeeMoveInterceptModal;
  getActionSummary(phase: Phase | undefined) {
    if (phase === WAGGLE_DANCE_PHASE) {
      return WaggleSummary;
    }
    if (phase === Phase.BUILDING) {
      return HoneybeeBuildSummary;
    }
    return undefined;
  }
  moveGoodsMessage() {
    return "Deliver goods; pay $1 per bee swarm in every City entered.";
  }
}
