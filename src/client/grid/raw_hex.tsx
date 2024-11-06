import { ReactNode, useMemo } from "react";
import { City } from "../../engine/map/city";
import { BaseTileData, calculateTrackInfo, Location } from "../../engine/map/location";
import { isTownTile } from "../../engine/map/tile";
import { Good } from "../../engine/state/good";
import { LocationType } from "../../engine/state/location_type";
import { assertNever } from "../../utils/validate";
import { HexNameLegacy, Town } from "./hex";
import * as styles from "./hex_grid.module.css";
import { Point, pointBetween, Track, TrackLegacy } from "./track";

interface RawHexLegacyProps {
  space?: Location | City;
  tile?: BaseTileData;
  asCity?: Good;
  children?: ReactNode;
  className?: string;
  onClick(): void;
}

export function goodStyle(good: Good): string {
  switch (good) {
    case Good.BLACK:
      return styles.black;
    case Good.BLUE:
      return styles.blue;
    case Good.PURPLE:
      return styles.purple;
    case Good.RED:
      return styles.red;
    case Good.YELLOW:
      return styles.yellow;
    default:
      assertNever(good);
  }
}

export function style(space: City | Location | undefined): string {
  if (space instanceof City) {
    return goodStyle(space.goodColor());
  } else if (space instanceof Location) {
    const type = space.getLocationType();
    switch (type) {
      case LocationType.PLAIN:
        return styles.plain;
      case LocationType.RIVER:
        return styles.river;
      case LocationType.MOUNTAIN:
        return styles.mountain;
      default:
        assertNever(type);
    }
  } else {
    return styles.unpassable;
  }
}

export function RawHexLegacy({ space, asCity, className, tile, children, onClick }: RawHexLegacyProps) {
  return <div data-coordinates={space?.coordinates.serialize()} className={[className, styles['hex'], asCity != null ? goodStyle(asCity) : style(space)].join(' ')} onClick={onClick}>
    <div className={styles['hex-left']}></div>
    <div className={styles['hex-body']}></div>
    <div className={styles['hex-right']}></div>
    {tile && <TrackLegacy track={calculateTrackInfo(tile)} />}
    {space instanceof Location && space.hasTown() && (!tile || isTownTile(tile.tileType)) && <Town />}
    {space instanceof City && <HexNameLegacy name={space.cityName()} />}
    {space instanceof Location && space.hasTown() && <HexNameLegacy name={space.getTownName()!} />}
    {children}
  </div>;
}

export function goodColor(good: Good): string {
  switch (good) {
    case Good.BLACK:
      return 'black';
    case Good.BLUE:
      return 'blue';
    case Good.PURPLE:
      return 'purple';
    case Good.RED:
      return 'red';
    case Good.YELLOW:
      return 'yellow';
    default:
      assertNever(good);
  }
}

export function color(space: City | Location | undefined): string {
  if (space instanceof City) {
    return goodColor(space.goodColor());
  } else if (space instanceof Location) {
    const type = space.getLocationType();
    switch (type) {
      case LocationType.PLAIN:
        return 'lightgreen';
      case LocationType.RIVER:
        return 'lightblue';
      case LocationType.MOUNTAIN:
        return 'brown';
      default:
        assertNever(type);
    }
  } else {
    return 'lightgrey';
  }
}

interface RawHexProps {
  space: Location | City;
  tile?: BaseTileData;
  asCity?: Good;
  size: number;
  className?: string;
  hideGoods?: boolean;
  offsetX?: number;
  offsetY?: number;
}

export function RawHex({ space, asCity, tile, size, hideGoods }: RawHexProps) {
  const coordinates = space.coordinates;
  const center = useMemo(() => offsetPoint({
    x: size * (1.5 * coordinates.q),
    y: size * ((Math.sqrt(3) / 2 * coordinates.q) + (Math.sqrt(3) * coordinates.r)),
  }, 100, Math.PI * 1 / 4), [coordinates]);
  const corners = useMemo(() =>
    [
      offsetPoint(center, size, 0),
      offsetPoint(center, size, Math.PI / 3),
      offsetPoint(center, size, Math.PI * 2 / 3),
      offsetPoint(center, size, Math.PI),
      offsetPoint(center, size, Math.PI * 4 / 3),
      offsetPoint(center, size, Math.PI * 5 / 3),
    ].map((p) => [p.x, p.y].join(' ')).join(',')
    , [center, size]);
  const hexColor = asCity ? goodColor(asCity) : color(space);
  const tileInfo = tile != null ? tile : space instanceof Location ? space.getTileData() : undefined;
  return <>
    <polygon data-coordinates={space.coordinates.toString()} points={corners} stroke="black" fill={hexColor} strokeWidth="1" />
    {tileInfo && calculateTrackInfo(tileInfo).map((t, index) => <Track key={index} center={center} size={size} track={t} />)}
    {space instanceof Location && space.hasTown() && (!tile || isTownTile(tile.tileType)) && <circle cx={center.x} cy={center.y} fill="white" r={size / 2} />}
    {space instanceof Location && space.hasTown() && <HexName name={space.getTownName()!} center={center} size={size} />}
    {space instanceof City && <HexName name={space.cityName()} center={center} size={size} />}
    {space instanceof City && !hideGoods && space.getGoods().map((g, index) => <GoodBlock key={index} offset={index} good={g} center={center} size={size} />)}
  </>;
}

function GoodBlock({ center, size, offset, good }: { good: Good, center: Point, size: number, offset: number }) {
  const goodSize = size / 3;

  // If there are too many goods on the hex, split them up into top and bottom goods.
  const xOffset = offset % 6;
  const yOffset = offset < 6 ? -2.2 : 1.2;

  const x = center.x - (1.8 * goodSize) + (goodSize * xOffset / 2);
  const y = center.y + (yOffset * goodSize);
  return <rect data-good={good} width={goodSize} height={goodSize} x={x} y={y} fill={goodColor(good)} strokeWidth={1} stroke="black" />;
}

function HexName({ name, center, size }: { name: string, center: Point, size: number }) {
  const right = offsetPoint(center, size, 0);
  const bottomRight = offsetPoint(center, size, Math.PI / 3);
  const bottomLeft = offsetPoint(center, size, Math.PI * 2 / 3);
  const left = offsetPoint(center, size, Math.PI);
  const topLeft = offsetPoint(center, size, Math.PI * 4 / 3);
  const topRight = offsetPoint(center, size, Math.PI * 5 / 3);
  const townCorners = useMemo(() => [
    left,
    pointBetween(topLeft, left, 0.25),
    pointBetween(topRight, right, 0.25),
    right,
    pointBetween(bottomRight, right, 0.25),
    pointBetween(bottomLeft, left, 0.25),
  ].map((p) => [p.x, p.y].join(' ')).join(',')
    , [center, size]);
  return <>
    <polygon points={townCorners} stroke="white" fill="white" strokeWidth="1" />
    <text x={center.x} y={center.y} dominantBaseline="middle" textAnchor="middle">{name}</text>
  </>;
}

export function offsetPoint(point: { x: number, y: number }, size: number, rad: number): { x: number, y: number } {
  return {
    x: point.x + Math.cos(rad) * size,
    y: point.y + Math.sin(rad) * size,
  };
}