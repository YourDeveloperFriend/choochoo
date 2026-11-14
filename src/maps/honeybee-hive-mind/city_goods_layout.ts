import { cityIdentifier } from "./city_geometry";
import { Good } from "../../engine/state/good";
import { Point } from "../../utils/point";

type Box = Point & { width: number; height: number };
type Circle = Point & { radius: number };

/** Upright coordinates relative to the center of the whole logical City. */
export function honeybeeCityGoodsLayout(
  size: number,
  goodsCount: number,
  beeCount: number,
  centers: Point[] = [{ x: 0, y: 0 }],
  color?: Good,
  circles: Circle[] = [],
  centralCity = false,
) {
  const cubeSize = size / 3;
  const cubeExtent = cubeSize * 1.3;
  const beeSize = cubeSize * 1.25;
  const extent = beeSize * 1.3;
  const large = centers.length > 1;
  const identifier = cityIdentifier(size, large, color);
  // In the crowded central City, contents may overlap the fixed artwork, but
  // leave the middle of the numeral visible. Other City identifiers stay clear.
  const protectedAreas: Box[] = centralCity
    ? [
        {
          x: -size * 0.16,
          y: -size * 0.13,
          width: size * 0.32,
          height: size * 0.18,
        },
      ]
    : [
        identifier.bee,
        {
          x: identifier.number.x - size * 0.24,
          y: identifier.number.y - size * 0.26,
          width: size * 0.48,
          height: size * 0.52,
        },
      ];
  const gap = size * 0.015;
  const intersects = (a: Box, b: Box) =>
    a.x < b.x + b.width + gap &&
    a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap &&
    a.y + a.height + gap > b.y;
  const contains = (p: Point) =>
    centers.some((center) => {
      const x = Math.abs(p.x - center.x),
        y = Math.abs(p.y - center.y);
      return (
        x <= (size * Math.sqrt(3)) / 2 - gap &&
        y <= size - x / Math.sqrt(3) - gap
      );
    });
  const clear = (box: Box, areas = protectedAreas, insideCity = true) => {
    // Corners and edge midpoints also guard the concave compound-City outline.
    for (const dx of [0, 0.5, 1]) {
      for (const dy of [0, 0.5, 1]) {
        if (
          insideCity &&
          !contains({ x: box.x + box.width * dx, y: box.y + box.height * dy })
        ) {
          return false;
        }
      }
    }
    if (areas.some((area) => intersects(box, area))) {
      return false;
    }
    return circles.every((circle) => {
      const x = Math.max(box.x, Math.min(circle.x, box.x + box.width));
      const y = Math.max(box.y, Math.min(circle.y, box.y + box.height));
      return Math.hypot(x - circle.x, y - circle.y) > circle.radius + gap;
    });
  };
  const candidates: Point[] = [];
  const minX = Math.min(...centers.map((c) => c.x)) - size * 0.8;
  const maxX = Math.max(...centers.map((c) => c.x)) + size * 0.8;
  const minY = Math.min(...centers.map((c) => c.y)) - size * 0.8;
  const maxY = Math.max(...centers.map((c) => c.y)) + size * 0.8;
  for (let y = minY; y <= maxY; y += size * 0.04) {
    for (let x = minX; x <= maxX; x += size * 0.04) {
      candidates.push({ x, y });
    }
  }
  const preferred = {
    x:
      centers[0].x +
      (large && color === Good.RED
        ? -0.15
        : large && color === Good.BLUE
          ? 0.15
          : 0) *
        size,
    y:
      centers[0].y +
      (large && (color === Good.RED || color === Good.BLUE) ? -0.33 : -0.72) *
        size +
      cubeExtent / 2,
  };
  const rowCandidates = [...candidates, preferred].sort(
    (a, b) =>
      Math.hypot(a.x - preferred.x, a.y - preferred.y) -
      Math.hypot(b.x - preferred.x, b.y - preferred.y),
  );
  const desiredWidth = Math.min(
    centralCity ? size * 0.8 : size * 1.5,
    cubeExtent + Math.max(0, goodsCount - 1) * cubeSize * 0.75,
  );
  // Standard goods spacing takes priority over the sloping upper hex edge on
  // peripheral Cities, just as on the shared board renderer. Keep this row
  // above the identifier and reserve its full bounds when placing swarms.
  const peripheralRow = {
    x: centers[0].x - desiredWidth / 2,
    y: centers[0].y - size * 0.78,
    width: desiredWidth,
    height: cubeExtent,
  };
  let row: Box | undefined =
    !large && !centralCity && clear(peripheralRow, protectedAreas, false)
      ? peripheralRow
      : undefined;
  for (
    let width = desiredWidth;
    width >= cubeExtent - 0.001 && !row;
    width -= size * 0.04
  ) {
    for (const point of rowCandidates) {
      const box = {
        x: point.x - width / 2,
        y: point.y - cubeExtent / 2,
        width,
        height: cubeExtent,
      };
      // Reserve the lower interior for full-size swarms in the central City.
      if (centralCity && box.y + box.height > -size * 0.13 - gap) {
        continue;
      }
      if (clear(box)) {
        row = box;
        break;
      }
    }
  }
  if (!row) {
    throw new Error("No clear Honeybee goods row");
  }
  const spacing =
    goodsCount < 2 ? 0 : (row.width - cubeExtent) / (goodsCount - 1);
  const goods = Array.from({ length: goodsCount }, (_, index) => ({
    x: row!.x + index * spacing + cubeSize / 2,
    y: row!.y + cubeSize / 2,
  }));
  const areas = goodsCount ? [...protectedAreas, row] : [...protectedAreas];
  const pockets: Box[] = [];
  // Prefer the upper half's side pockets, then fill any remaining clear interior.
  const preferences = centers.flatMap((center) => [
    { x: center.x - size * 0.56, y: center.y + size * 0.04 },
    { x: center.x + size * 0.56, y: center.y + size * 0.04 },
    { x: center.x, y: center.y + size * 0.56 },
  ]);
  const beeCandidates = [...preferences, ...candidates].sort(
    (a, b) =>
      Math.min(...preferences.map((p) => Math.hypot(a.x - p.x, a.y - p.y))) -
      Math.min(...preferences.map((p) => Math.hypot(b.x - p.x, b.y - p.y))),
  );
  for (const point of beeCandidates) {
    if (pockets.length >= beeCount) {
      break;
    }
    const box = {
      x: point.x - extent / 2,
      y: point.y - extent / 2,
      width: extent,
      height: extent,
    };
    if (clear(box, areas)) {
      pockets.push(box);
      areas.push(box);
    }
  }
  if (beeCount && !pockets.length) {
    throw new Error("No clear Honeybee swarm pocket");
  }
  const groupCount = pockets.length;
  const bees = pockets.map((point, index) => ({
    x: point.x,
    y: point.y,
    count:
      Math.floor(beeCount / groupCount) +
      (index < beeCount % groupCount ? 1 : 0),
  }));
  return { goods, bees, beeSize, beeExtent: extent, goodsSize: cubeSize * 3 };
}
