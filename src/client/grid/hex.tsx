import { useMemo } from "react";
import { Rotation } from "../../engine/game/map_settings";
import { City } from "../../engine/map/city";
import { Space } from "../../engine/map/grid";
import { calculateTrackInfo, Land } from "../../engine/map/location";
import { isTownTile } from "../../engine/map/tile";
import { Track, TrackInfo } from "../../engine/map/track";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { Direction } from "../../engine/state/tile";
import { CyprusMapData } from "../../maps/cyprus/map_data";
import { Coordinates } from "../../utils/coordinates";
import {
  coordinatesToCenter,
  edgeCorners,
  getCorners,
  getHalfCorners,
  Point,
  polygon,
} from "../../utils/point";
import { assert, assertNever } from "../../utils/validate";
import { Rotate } from "../components/rotation";
import { useGameKey } from "../utils/injection_context";
import { ClickTarget } from "./click_target";
import { goodStyle } from "./good";
import { GoodBlock } from "./good_block";
import * as styles from "./hex.module.css";
import * as gridStyles from "./hex_grid.module.css";
import { HexName } from "./hex_name";
import { OnRoll } from "./on_roll";
import { Track as TrackSvg } from "./track";

function cityColorStyles(space: City): string[] {
  const colors = space.goodColors();
  if (colors.length === 0) {
    return [styles.colorless];
  }
  return colors.map((color) => goodStyle(color));
}

function landColorStyle(space: Land): string {
  const type = space.getLandType();
  switch (type) {
    case SpaceType.PLAIN:
      return styles.plain;
    case SpaceType.RIVER:
      return styles.river;
    case SpaceType.WATER:
      return styles.water;
    case SpaceType.FIRE:
      return styles.fire;
    case SpaceType.MOUNTAIN:
      return styles.mountain;
    // TODO: render street and street
    case SpaceType.LAKE:
    case SpaceType.STREET:
    case SpaceType.SWAMP:
      return styles.swamp;
    case SpaceType.UNPASSABLE:
      return styles.unpassable;
    case SpaceType.DESERT:
      return styles.desert;
    case SpaceType.SKY:
      return styles.sky;
    case SpaceType.HILL:
      return styles.hill;
    default:
      assertNever(type);
  }
}

interface TerrainHexProps {
  space: Land | City;
  size: number;
  clickTargets: Set<ClickTarget>;
  rotation?: Rotation;
}

// The size of the inner part of city hexes, relative to the full size of the hex
const CITY_INNER_HEX_SIZE = 0.85;

export function LowerTerrainHex({
  space,
  size,
  clickTargets,
  rotation,
}: TerrainHexProps) {
  const coordinates = space.coordinates;
  const center = useMemo(
    () => coordinatesToCenter(coordinates, size),
    [coordinates, size],
  );

  const corners = useMemo(
    () => polygon(getCorners(center, size)),
    [center, size],
  );

  const isClickableCity =
    clickTargets.has(ClickTarget.CITY) && space instanceof City;
  const isClickableTown =
    clickTargets.has(ClickTarget.TOWN) &&
    space instanceof Land &&
    space.hasTown();
  const isClickableBuild =
    clickTargets.has(ClickTarget.LOCATION) &&
    space instanceof Land &&
    space.getLandType() !== SpaceType.UNPASSABLE &&
    space.getLandType() !== SpaceType.WATER;
  const isClaimableTrack =
    clickTargets.has(ClickTarget.LOCATION) &&
    space instanceof Land &&
    space.getTrack().some((track) => track.isClaimable());

  const clickable =
    isClickableCity || isClickableTown || isClickableBuild || isClaimableTrack;

  const gameKey = useGameKey();

  if (space instanceof Land) {
    const hexColor = landColorStyle(space);

    return (
      <>
        <polygon
          className={`${styles.location} ${clickable ? gridStyles.clickable : ""} ${hexColor}`}
          data-coordinates={space.coordinates.serialize()}
          points={corners}
          stroke="black"
          strokeWidth="0"
        />
        <polygon
          fillOpacity="0"
          data-coordinates={space.coordinates.toString()}
          points={corners}
          stroke="black"
          strokeWidth={size / 100}
        />
        {space.unpassableExits().map((direction) => (
          <EdgeBoundary
            key={direction}
            center={center}
            size={size}
            direction={direction}
          />
        ))}
        {gameKey === "cyprus" && (
          <CyprusBorder space={space} center={center} size={size} />
        )}
      </>
    );
  } else {
    const [hexColor, alternateColor] = cityColorStyles(space);

    const onRoll = space.onRoll();
    const cityGroup: CityGroup = space.onRoll()[0]?.group ?? CityGroup.WHITE;
    // Determine the "outer fill" color, which is the thick border around cities indicating its goods-growth group color.
    const outerFill = (() => {
      if (cityGroup == CityGroup.WHITE) return "#ffffff";
      return "#222222";
    })();

    const innerCorners = polygon(
      getCorners(center, size * CITY_INNER_HEX_SIZE),
    );

    return (
      <>
        <polygon
          className={`${clickable ? gridStyles.clickable : ""} ${hexColor}`}
          data-coordinates={space.coordinates.serialize()}
          points={corners}
          fill={outerFill}
          stroke="black"
          strokeWidth="0"
        />
        <polygon
          className={`${styles.city} ${hexColor}`}
          data-coordinates={space.coordinates.serialize()}
          points={innerCorners}
          stroke="black"
          strokeWidth="0"
        />
        {alternateColor && (
          <HalfHex
            center={center}
            size={size * 0.85}
            alternateColor={alternateColor}
          />
        )}
        <polygon
          fillOpacity="0"
          data-coordinates={space.coordinates.toString()}
          points={corners}
          stroke="black"
          strokeWidth={size / 100}
        />
        {gameKey === "cyprus" && (
          <CyprusBorder space={space} center={center} size={size} />
        )}
        {onRoll.length > 0 && (
          <OnRoll
            city={space}
            cityGroup={cityGroup}
            center={center}
            size={size}
            rotation={rotation}
          />
        )}
        {space.name() != "" && (
          <HexName
            name={space.name()}
            rotation={rotation}
            center={center}
            size={size}
          />
        )}
      </>
    );
  }
}

export function UpperTerrainHex({ space, size, rotation }: TerrainHexProps) {
  const coordinates = space.coordinates;
  const center = useMemo(
    () => coordinatesToCenter(coordinates, size),
    [coordinates, size],
  );

  if (space instanceof Land) {
    return (
      <>
        {(space.getTileType() != null
          ? isTownTile(space.getTileType()!)
          : space.hasTown()) && (
          <circle cx={center.x} cy={center.y} fill="white" r={size * 0.4} />
        )}
        {space.getTileType() == null && space.getTerrainCost() != null && (
          <TerrainCost
            space={space}
            center={center}
            size={size}
            rotation={rotation}
          />
        )}
        {space.hasTown() && (
          <HexName
            name={space.name()!}
            rotation={rotation}
            center={center}
            size={size}
          />
        )}
      </>
    );
  } else {
    return null;
  }
}

interface TrackHexProps {
  space: Land | City;
  size: number;
  highlightedTrack?: Track[];
  rotation?: Rotation;
}

export function TrackHex({
  space,
  highlightedTrack,
  size,
  rotation,
}: TrackHexProps) {
  const coordinates = space.coordinates;
  const center = useMemo(
    () => coordinatesToCenter(coordinates, size),
    [coordinates, size],
  );

  const trackInfo = useMemo(() => {
    const tileData = space instanceof Land ? space.getTileData() : undefined;
    if (tileData == null) return [];
    return calculateTrackInfo(tileData);
  }, [space]);

  const highlightedTrackSet = useMemo(() => {
    if (highlightedTrack == null) return new Set<TrackInfo>();
    const inHex = highlightedTrack.filter((t) =>
      t.coordinates.equals(coordinates),
    );
    return new Set(
      trackInfo.filter((t) =>
        t.exits.every((e) => inHex.some((t) => t.getExits().includes(e))),
      ),
    );
  }, [highlightedTrack, coordinates, trackInfo]);

  return (
    <>
      {trackInfo.map((t, index) => (
        <TrackSvg
          key={index}
          center={center}
          size={size}
          track={t}
          highlighted={highlightedTrackSet.has(t)}
          rotation={rotation}
        />
      ))}
    </>
  );
}

interface GoodsOnHexProps {
  space: Land | City;
  size: number;
  selectedGood?: { good: Good; coordinates: Coordinates };
  clickTargets: Set<ClickTarget>;
  rotation?: Rotation;
}

export function GoodsOnHex({
  space,
  selectedGood,
  size,
  clickTargets,
  rotation,
}: GoodsOnHexProps) {
  const coordinates = space.coordinates;
  const center = useMemo(
    () => coordinatesToCenter(coordinates, size),
    [coordinates, size],
  );

  const goods = space.getGoods();

  const selectedGoodIndex = useMemo(() => {
    if (selectedGood == null) return undefined;
    if (!selectedGood.coordinates.equals(coordinates)) return undefined;
    assert(space instanceof City);
    return space.getGoods().indexOf(selectedGood.good);
  }, [space, coordinates, selectedGood]);

  return (
    <>
      {goods.map((g, index) => (
        <GoodBlock
          key={index}
          clickable={clickTargets.has(ClickTarget.GOOD)}
          coordinates={coordinates}
          highlighted={selectedGoodIndex === index}
          offset={index}
          goodsCount={goods.length}
          good={g}
          center={center}
          size={size}
          rotation={rotation}
        />
      ))}
    </>
  );
}

interface TerrainCostProps {
  space: Land;
  center: Point;
  size: number;
  rotation?: Rotation;
}

function TerrainCost({ space, center, size, rotation }: TerrainCostProps) {
  const corners = useMemo(
    () => polygon(getCorners(center, size / 2)),
    [center, size],
  );

  return (
    <>
      <Rotate rotation={rotation} center={center} reverse={true}>
        <polygon
          fill="#cfddbb"
          points={corners}
          stroke="black"
          strokeWidth="0"
        />
        <text
          fontSize={size / 2.5}
          fill="#b63421"
          x={center.x}
          y={center.y + size / 20}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          ${space.getTerrainCost()!}
        </text>
      </Rotate>
    </>
  );
}

function CyprusBorder({
  space,
  center,
  size,
}: {
  space: Space;
  center: Point;
  size: number;
}) {
  const parseResult = space.getMapSpecific(CyprusMapData.parse);

  if (parseResult == null || parseResult.borderDirection == null) return <></>;

  return (
    <>
      {parseResult.borderDirection.map((direction) => (
        <EdgeBoundary
          key={direction}
          center={center}
          size={size}
          direction={direction}
        />
      ))}
    </>
  );
}

interface HalfHexProps {
  center: Point;
  size: number;
  alternateColor: string;
}

function HalfHex({ center, size, alternateColor }: HalfHexProps) {
  const corners = useMemo(
    () => polygon(getHalfCorners(center, size)),
    [center, size],
  );
  return (
    <polygon
      className={`${styles.city} ${alternateColor}`}
      points={corners}
      strokeWidth="0"
    />
  );
}

interface EdgeBoundaryProps {
  center: Point;
  size: number;
  direction: Direction;
}

export function EdgeBoundary({ center, size, direction }: EdgeBoundaryProps) {
  const [corner1, corner2] = useMemo(
    () => edgeCorners(center, size, direction),
    [center.x, center.y, size, direction],
  );
  return (
    <line
      x1={corner1.x}
      y1={corner1.y}
      x2={corner2.x}
      y2={corner2.y}
      stroke="red"
      strokeLinecap="round"
      strokeWidth={12}
    />
  );
}
