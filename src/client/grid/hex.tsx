import { ReactNode, useMemo } from "react";
import { Rotation } from "../../engine/game/map_settings";
import { City } from "../../engine/map/city";
import { Space } from "../../engine/map/grid";
import { calculateTrackInfo, Land } from "../../engine/map/location";
import { isTownTile } from "../../engine/map/tile";
import { Track, TrackInfo } from "../../engine/map/track";
import { CityGroup } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { SpaceStyle } from "../../engine/state/location_style";
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
import { assertNever } from "../../utils/validate";
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
  return colors
    .filter((color) => color !== Good.WHITE)
    .map((color) => goodStyle(color));
}

function landColorStyle(space: Land): string {
  const style = space.getSpaceStyle();
  if (style !== undefined) {
    switch (style) {
      case SpaceStyle.LIGHT_PLAIN:
        return styles.light_plain;
      case SpaceStyle.LIGHT_RIVER:
        return styles.light_river;
      case SpaceStyle.FJORD:
        return styles.fjord;
      case SpaceStyle.CANYON:  
        return styles.canyon;
      default:
        assertNever(style);
    }
  }

  const type = space.getLandType();
  switch (type) {
    case SpaceType.PLAIN:
      return styles.plain;
    case SpaceType.STREET:
    case SpaceType.RIVER:
      return styles.river;
    case SpaceType.WATER:
    case SpaceType.LAKE:
      return styles.water;
    case SpaceType.FIRE:
      return styles.fire;
    case SpaceType.MOUNTAIN:
      return styles.mountain;
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
    case SpaceType.CRATER:
      return styles.crater;
    case SpaceType.DARK_MOUNTAIN:
      return styles.darkMountain;
    case SpaceType.RIVER_MOUNTAIN:
      return styles.riverMountain;
    default:
      assertNever(type);
  }
}

interface TerrainHexProps {
  space: Land | City;
  size: number;
  isHighlighted: boolean;
  clickTargets: Set<ClickTarget>;
  rotation?: Rotation;
  selectedGood?: { good: Good; coordinates: Coordinates };
  highlightedTrack?: Track[];
}

// The size of the inner part of city hexes, relative to the full size of the hex
const CITY_INNER_HEX_SIZE = 0.85;

interface TerrainHexes {
  beforeTextures: ReactNode[];
  afterTextures: ReactNode[];
  afterOverlay: ReactNode[];
}

export function getTerrainHexes(props: TerrainHexProps): TerrainHexes {
  const key = props.space.coordinates.serialize();
  return {
    beforeTextures: [
      <LowerTerrainHex key={key + "LowerTerrainHex"} {...props} />,
    ],
    afterTextures: [
      <BorderBoundaries key={key + "BorderBoundaries"} {...props} />,
      <TrackHex key={key + "TrackHex"} {...props} />,
      <UpperTerrainHex key={key + "UpperTerrainHex"} {...props} />,
    ],
    afterOverlay: [<GoodsOnHex key={key + "GoodsOnHex"} {...props} />],
  };
}

function LowerTerrainHex({ space, size, clickTargets }: TerrainHexProps) {
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
    clickTargets.has(ClickTarget.LAND) &&
    space instanceof Land &&
    !space.isUnpassable();
  const isClaimableTrack =
    clickTargets.has(ClickTarget.LAND) &&
    space instanceof Land &&
    space.getTrack().some((track) => track.isClaimable());

  const clickable =
    isClickableCity || isClickableTown || isClickableBuild || isClaimableTrack;

  if (space instanceof Land) {
    const hexColor = landColorStyle(space);

    return (
      <>
        {/** fill */}
        <polygon
          className={`${styles.location} ${clickable ? gridStyles.clickable : ""} ${hexColor}`}
          data-coordinates={space.coordinates.serialize()}
          points={corners}
          stroke="black"
          strokeWidth="0"
        />
        {/** border */}
        <polygon
          fillOpacity="0"
          data-coordinates={space.coordinates.toString()}
          points={corners}
          stroke="black"
          strokeWidth={size / 100}
        />
      </>
    );
  } else {
    return null;
  }
}

function BorderBoundaries({ space, size }: TerrainHexProps) {
  const gameKey = useGameKey();
  const center = useMemo(
    () => coordinatesToCenter(space.coordinates, size),
    [space.coordinates, size],
  );

  return (
    <>
      {/** unpassable borders */}
      {space instanceof Land &&
        space
          .unpassableExits()
          .map((direction) => (
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
}

function UpperTerrainHex({
  space,
  size,
  rotation,
  isHighlighted,
  clickTargets,
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
        {(space.name()?.length ?? 0) > 0 && (
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
    return (
      <>
        <CityHex
          city={space}
          size={size}
          clickable={clickTargets.has(ClickTarget.CITY)}
          rotation={rotation}
        />
        {isHighlighted && (
          <polygon
            fillOpacity="0"
            data-coordinates={space.coordinates.toString()}
            points={corners}
            stroke="yellow"
            strokeWidth={size / 10}
          />
        )}
      </>
    );
  }
}

interface TrackHexProps {
  space: Land | City;
  size: number;
  highlightedTrack?: Track[];
  rotation?: Rotation;
}

function CityHex({
  city,
  size,
  rotation,
  clickable,
}: {
  city: City;
  size: number;
  rotation?: Rotation;
  clickable: boolean;
}) {
  const coordinates = city.coordinates;
  const center = useMemo(
    () => coordinatesToCenter(coordinates, size),
    [coordinates, size],
  );

  const corners = useMemo(
    () => polygon(getCorners(center, size)),
    [center, size],
  );

  const [hexColor, alternateColor] = cityColorStyles(city);

  const cityGroup: CityGroup = city.onRoll()[0]?.group ?? CityGroup.WHITE;
  // Determine the "outer fill" color, which is the thick border around cities indicating its goods-growth group color.
  const outerFill = (() => {
    if (cityGroup == CityGroup.WHITE) return "#ffffff";
    return "#222222";
  })();

  const innerCorners = polygon(getCorners(center, size * CITY_INNER_HEX_SIZE));

  return (
    <>
      <polygon
        className={`${clickable ? gridStyles.clickable : ""} ${hexColor}`}
        data-coordinates={city.coordinates.serialize()}
        points={corners}
        fill={outerFill}
        stroke="black"
        strokeWidth="0"
      />
      <polygon
        className={`${styles.city} ${hexColor}`}
        data-coordinates={city.coordinates.serialize()}
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
        data-coordinates={city.coordinates.toString()}
        points={corners}
        stroke="black"
        strokeWidth={size / 100}
      />
      <OnRoll city={city} center={center} size={size} rotation={rotation} />
      {city.name() != "" && (
        <HexName
          name={city.name()}
          rotation={rotation}
          center={center}
          size={size}
        />
      )}
    </>
  );
}

function TrackHex({ space, highlightedTrack, size, rotation }: TrackHexProps) {
  const coordinates = space.coordinates;
  const center = useMemo(
    () => coordinatesToCenter(coordinates, size),
    [coordinates, size],
  );

  const tileData = useMemo(() => {
    return space instanceof Land ? space.getTileData() : undefined;
  }, [space]);

  const trackInfo = useMemo(() => {
    if (tileData == null) return [];
    return calculateTrackInfo(tileData);
  }, [tileData]);

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

  if (tileData == null) return <></>;

  return (
    <g
      data-tile-type={tileData?.tileType}
      data-orientation={tileData?.orientation}
    >
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
    </g>
  );
}

interface GoodsOnHexProps {
  space: Land | City;
  size: number;
  selectedGood?: { good: Good; coordinates: Coordinates };
  clickTargets: Set<ClickTarget>;
  rotation?: Rotation;
}

function GoodsOnHex({
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
      <polygon fill="#cfddbb" points={corners} stroke="black" strokeWidth="0" />
      <Rotate rotation={rotation} center={center} reverse={true}>
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
          color="grey"
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
  color?: string;
}

function EdgeBoundary({ center, size, direction, color }: EdgeBoundaryProps) {
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
      stroke={color ?? "red"}
      strokeLinecap="round"
      strokeWidth={size / 8}
    />
  );
}
