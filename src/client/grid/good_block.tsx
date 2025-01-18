import {Rotation} from "../../engine/game/map_settings";
import {Good} from "../../engine/state/good";
import {Coordinates} from "../../utils/coordinates";
import {Rotate} from "../components/rotation";
import {goodStyle} from "./good";
import * as styles from './good_block.module.css';
import * as hexGridStyles from './hex_grid.module.css';
import {Point} from "./point";

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

export function GoodBlock({ center, size, offset, goodsCount, good, coordinates, highlighted, clickable, rotation }: GoodBlockProps) {
  const goodSize = size / 4;
  const maxGoodsPerRow = 3;

  // Render 6 goods per row
  const xOffset = offset % maxGoodsPerRow;
  const yOffset = Math.floor(offset / maxGoodsPerRow);

  const rowSize = Math.floor(offset / maxGoodsPerRow) < Math.floor(goodsCount/maxGoodsPerRow) ? maxGoodsPerRow : goodsCount % maxGoodsPerRow;

  const x = center.x - (goodSize*rowSize+0.5*goodSize*(rowSize-1))/2 + xOffset*1.5*goodSize;
  const y = center.y + (yOffset * goodSize * 1.5) - size*0.75;
  const stroke = highlighted ? (good === Good.YELLOW ? 'lightgreen' : 'yellow') : (good === Good.BLACK ? 'grey' : 'black');
  const strokeWidth = highlighted ? 2 : 1;
  return <Rotate rotation={rotation} center={center} reverse={true}>
    <rect className={`${clickable ? hexGridStyles.clickable : ''} ${styles.good} ${goodStyle(good)}`}
      filter={`url(#cubeShadow)`}
      data-coordinates={coordinates.serialize()}
      data-good={good}
      width={goodSize}
      height={goodSize}
      x={x}
      y={y}
      strokeWidth={strokeWidth}
      stroke={stroke} />
  </Rotate>;
}
