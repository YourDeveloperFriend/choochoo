import { useMemo } from "react";
import { ClickTarget } from "../../client/grid/click_target";
import * as styles from "../../client/grid/hex.module.css";
import * as gridStyles from "../../client/grid/hex_grid.module.css";
import { peek } from "../../utils/functions";
import {
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
  coordinatesToCenter,
  LEFT,
  movePointInRadDirection,
  Point,
  polygon,
  RIGHT,
  TOP_LEFT,
  TOP_RIGHT,
} from "../../utils/point";
import { TexturesProps } from "../view_settings";

function movePointInRadDirections(
  point: Point,
  ...directions: [number, number][]
) {
  let reference = point;
  for (const direction of directions) {
    reference = movePointInRadDirection(reference, direction[0], direction[1]);
  }
  return reference;
}

function polygonFromDirections(
  startingPoint: Point,
  size: number,
  ...directions: number[]
): Point[] {
  const points = [startingPoint];
  for (const direction of directions) {
    points.push(movePointInRadDirection(peek(points), size, direction));
  }
  return points;
}

export function HeavyCardboardOverlayLayer({
  grid,
  size,
  clickTargets,
}: TexturesProps) {
  const city = useMemo(() => {
    return grid.cities().find((city) => city.data.mapSpecific?.center)!;
  }, [grid]);
  const points = useMemo(() => {
    const center = coordinatesToCenter(city.coordinates, size);
    const leftSide = movePointInRadDirections(
      center,
      [size, LEFT],
      [size, BOTTOM_LEFT],
      [size, LEFT],
    );
    return polygon(
      polygonFromDirections(
        leftSide,
        size,
        TOP_RIGHT,
        TOP_LEFT,
        TOP_RIGHT,
        RIGHT,
        TOP_RIGHT,
        RIGHT,
        BOTTOM_RIGHT,
        RIGHT,
        BOTTOM_RIGHT,
        BOTTOM_LEFT,
        BOTTOM_RIGHT,
        BOTTOM_LEFT,
        LEFT,
        BOTTOM_LEFT,
        LEFT,
        TOP_LEFT,
        LEFT,
      ),
    );
  }, [city, size]);
  return (
    <>
      <polygon
        points={points}
        fill="white"
        stroke="black"
        strokeWidth={size / 100}
      />
      <polygon
        points={points}
        data-coordinates={city.coordinates.serialize()}
        className={`${styles.colorless} ${styles.city} ${clickTargets?.has(ClickTarget.CITY) ? gridStyles.clickable : ""}`}
        stroke="black"
        strokeWidth={size / 100}
      />
      <image
        href="/static/heavy-cardboard.png"
        style={{ mixBlendMode: "darken" }}
        height={250}
        y="1575"
        x="720"
      />
    </>
  );
}

export function HeavyCardboardRivers() {
  return (
    <>
      <path
        className={styles.riverPath}
        d="m 896.5,1543.5 c 110.94753800000001,-31.58829999999989 -13.848247000000015,-153.18290000000002 52.477998999999954,-142.89069999999992 196.92938600000002,-6.643600000000106 85.18033700000001,151.36130000000003 205.22008900000014,118.55919999999992 84.83450199999993,-27.232899999999972 141.58624199999986,-48.18380000000002 119.78541199999995,-104.83320000000003 -9.68480999999997,-187.5634 105.03045999999995,94.78929999999991 185.97452999999996,-139.1866 43.94977999999992,-178.6391000000001 -209.58402999999998,-40.393200000000206 -249.83475999999996,-90.23940000000016"
      />
      <path
        className={styles.riverPath}
        d="m 999.5,1665.5 c 343.9475379999999,85.41170000000011 291.1517530000001,262.8171 264.47799899999995,452.1093000000001 -16.070613999999978,131.35639999999967 -153.819663,-65.63869999999997 -191.77991099999986,69.55919999999969 -18.16549800000007,71.76710000000003 23.586241999999856,100.81620000000021 -22.21458800000005,175.16679999999997"
      />
      <path
        className={styles.riverPath}
        d="m 1277.5,2017.5 c 16.947537999999895,131.4117000000001 124.1517530000001,82.81710000000021 247.47799899999995,72.10930000000008 111.92938600000002,-8.643600000000333 -71.81966299999999,221.36130000000003 102.22008900000014,189.5591999999997 61.83450199999993,-9.232899999999972 75.58624199999986,24.816200000000208 106.78541199999995,52.16679999999997"
      />
    </>
  );
}
