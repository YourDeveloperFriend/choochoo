import { ComponentType, ReactElement, ReactNode } from "react";
import { VariantConfig } from "../api/variant_config";
import { RowFactory } from "../client/game/final_overview_row";
import { ClickTarget, OnClickFunction } from "../client/grid/click_target";
import { InterCityConnection } from "../engine/state/inter_city_connection";
import { MapSettings, Rotation } from "../engine/game/map_settings";
import { City } from "../engine/map/city";
import { Land } from "../engine/map/location";
import { Good } from "../engine/state/good";
import { Coordinates } from "../utils/coordinates";
import { Point } from "../utils/point";
import { Grid } from "../engine/map/grid";
import { InterceptMoveModalProps } from "../engine/move/interceptor";
import { MoveData } from "../engine/move/move";
import { Action } from "../engine/state/action";
import { Phase } from "../engine/state/phase";
import { PlayerData } from "../engine/state/player";

export interface VariantConfigProps {
  config: Partial<VariantConfig>;
  isPending: boolean;
  setConfig: (c: VariantConfig) => void;
  errors?: Record<string, string>;
}

export interface RulesProps {
  variant: VariantConfig;
}

export interface TexturesProps {
  grid: Grid;
  size: number;
  rotation: Rotation | undefined;
  clickTargets?: Set<ClickTarget>;
}

export interface MoveRouteOverlayProps extends TexturesProps {
  incomeGain: number;
  move: MoveData;
  player: PlayerData;
}

export interface MapPublisher {
  name: string;
  /** Wording before the name, e.g. "Developed and published by". */
  role: string;
  /** Single-color SVG; drawn in the current text color. */
  logoSrc: string;
  purchaseUrl?: string;
}

export interface CityVisualProps {
  grid: Grid;
  /** Custom city renderers draw their own outline when highlighted. */
  highlighted?: boolean;
  city: City;
  center: Point;
  size: number;
  rotation?: Rotation;
  clickable: boolean;
}

export interface TownVisualProps {
  town: Land;
  center: Point;
  size: number;
  rotation?: Rotation;
}

export interface CityGoodsProps extends CityVisualProps {
  selectedGood?: { good: Good; coordinates: Coordinates };
}

export interface GoodsTableVisual {
  className?: string;
  content: ReactNode;
}

export interface MapViewSettings extends MapSettings {
  hideImplementerCredit?: boolean;
  playerCountNote?: ReactNode;
  hideRiverEditor?: boolean;
  spaceAfterMapHeader?: boolean;
  getGoodsTableVisual?(good: Good): GoodsTableVisual | undefined;
  getLandFill?(space: Land): string | undefined;
  renderCity?: ComponentType<CityVisualProps>;
  renderTown?: ComponentType<TownVisualProps>;
  renderCityGoods?: ComponentType<CityGoodsProps>;

  getInitialVariantConfig?(): VariantConfig;
  getVariantConfigEditor?(props: VariantConfigProps): ReactNode;

  additionalSliders?: Array<() => ReactElement>;
  getVariantString?(variant: VariantConfig): string[] | undefined;
  getMapRules(props: RulesProps): ReactElement;
  publisher?: MapPublisher;
  /** Marker scale for compact boards with several parallel printed links. */
  interCityConnectionScale?: number;
  /** Translucent markers for maps with goods close to printed links. */
  interCityConnectionFillOpacity?: number;
  getInterCityConnectionPosition?(
    connection: InterCityConnection,
    size: number,
    connections?: InterCityConnection[],
  ): Point | undefined;
  getTexturesLayer?(props: TexturesProps): ReactNode;
  getOverlayLayer?(props: TexturesProps): ReactNode;
  getMoveRouteOverlay?(props: MoveRouteOverlayProps): ReactNode;
  /** Active-game-only UI; never rendered in standalone map previews. */
  getGameMapOverlay?(props: TexturesProps): ReactNode;
  getGameMapControls?(): ReactNode;
  gameMapWrapper?: import("react").ComponentType<{ children: ReactNode }>;
  getFinalOverviewRows?(): RowFactory[];
  getActionCaption?(action: Action): string[] | string | undefined;
  renderLogText?(props: { text: string; grid: Grid }): ReactNode;
  moveGoodsMessage?(): string | undefined;
  getMoveCost?(grid: Grid, player: PlayerData, move: MoveData): number;
  moveInterceptModal?(props: InterceptMoveModalProps): ReactNode;
  getActionSummary?(phase: Phase | undefined): undefined | (() => ReactNode);
  getPlayerStatColumns?(): Array<{
    header: string;
    cell: ({ player }: { player: PlayerData }) => ReactNode;
  }>;
  useOnMapClick?: OnClickFunction;

  // Map-specific land space styles, keyed by the string stored in a land
  // space's `style` field. Lets a map bring its own CSS module for styling
  // unique to it, instead of adding shared enum values/CSS for a single map.
  getLandStyles?(): Record<string, string>;
}
