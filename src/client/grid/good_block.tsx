import { Rotation } from "../../engine/game/map_settings";
import { Good } from "../../engine/state/good";
import { Coordinates } from "../../utils/coordinates";
import { Point } from "../../utils/point";
import { Rotate } from "../components/rotation";
import { goodStyle } from "./good";
import * as styles from "./good_block.module.css";
import * as hexGridStyles from "./hex_grid.module.css";

interface GoodBlockProps {
  good: Good;
  center: Point;
  size: number;
  offset: number;
  goodsCount: number;
  coordinates: Coordinates;
  highlighted: boolean;
  clickable: boolean;
  rotation?: Rotation;
}

export function GoodBlock({
  center,
  size,
  offset,
  goodsCount,
  good,
  coordinates,
  highlighted,
  clickable,
  rotation,
}: GoodBlockProps) {
  const goodSize = size / 3;
  const maxGoodsPerRow = 5;
  const goodSpacing = goodSize * 0.75;

  // Render 6 goods per row
  const xOffset = offset % maxGoodsPerRow;
  const yOffset = Math.floor(offset / maxGoodsPerRow);

  const rowSize =
    Math.floor(offset / maxGoodsPerRow) <
    Math.floor(goodsCount / maxGoodsPerRow)
      ? maxGoodsPerRow
      : goodsCount % maxGoodsPerRow;

  const x =
    center.x -
    (goodSpacing * (rowSize - 1) + goodSize) / 2 +
    xOffset * goodSpacing;
  const y = center.y + yOffset * goodSize * 1.5 - size * 0.75;
  const stroke = highlighted
    ? good === Good.YELLOW
      ? "lightgreen"
      : "yellow"
    : good === Good.BLACK
      ? "grey"
      : "black";
  const strokeWidth = highlighted ? 2 : 1;
  return (
    <Rotate rotation={rotation} center={center} reverse={true}>
      <polygon
        points={`${x},${y} ${x + goodSize},${y} ${x + goodSize * 1.3},${y + goodSize * 0.3} ${x + goodSize * 1.3},${y + goodSize * 1.3} ${x + goodSize * 0.3},${y + goodSize * 1.3} ${x},${y + goodSize}`}
        className={`${styles.goodBackground} ${goodStyle(good)}`}
        strokeWidth={strokeWidth}
        stroke={stroke}
      />
      <line
        x1={x + goodSize}
        y1={y + goodSize}
        x2={x + goodSize * 1.3}
        y2={y + goodSize * 1.3}
        strokeWidth={strokeWidth}
        stroke={stroke}
      />
      <rect
        className={`${clickable ? hexGridStyles.clickable : ""} ${styles.good} ${goodStyle(good)}`}
        data-coordinates={coordinates.serialize()}
        data-good={good}
        width={goodSize}
        height={goodSize}
        x={x}
        y={y}
        strokeWidth={strokeWidth}
        stroke={stroke}
      />
    </Rotate>
  );
}
