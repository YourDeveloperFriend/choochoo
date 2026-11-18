import { expect, it } from "vitest";
import { EngineDelegator } from "../../engine/framework/engine";
import { injectGrid } from "../../engine/game/state";
import { Rotation } from "../../engine/game/map_settings";
import { coordinatesToCenter } from "../../utils/point";
import { readGame } from "../../testing/harness/read_game";
import { HONEYBEE_HIVE_MIND_KEY as gameKey } from "./identity";
import { boardCoordinates as c } from "./grid";
import { cityCenter, cityMembers, uprightPoint } from "./city_geometry";
import { honeybeeCityGoodsLayout } from "./city_goods_layout";
import { honeybeeInterurbanCircles } from "./interurban_layout";

for (const count of [3, 4, 5]) {
  it(`keeps goods and swarms clear of every claim circle with ${count} players`, () => {
    const state = EngineDelegator.singleton.start({
      game: { id: 1, gameKey, variant: {} },
      players: Array.from({ length: count }, (_, i) => ({ playerId: i + 1 })),
      seed: "honeybee-layout",
    });
    const grid = readGame({ gameKey, gameData: state.gameData }, () =>
      injectGrid()(),
    );
    const size = 100;
    const circles = honeybeeInterurbanCircles(grid.connections, size);
    expect(grid.connections.filter((c) => c.id.startsWith("0-"))).toHaveLength(
      count === 5 ? 12 : 6,
    );
    expect(
      new Set(circles.map((c) => `${c.x.toFixed(3)},${c.y.toFixed(3)}`)).size,
    ).toBe(grid.connections.length);
    for (const coord of [c(6, 6), c(5, 5), c(6, 5), c(6, 7)]) {
      const city = grid.get(coord)!;
      if (!("goodColors" in city)) {
        throw new Error("Expected City");
      }
      const members = cityMembers(city, grid),
        center = cityCenter(members, size);
      const centers = members.map((half) => {
        const p = coordinatesToCenter(half.coordinates, size);
        return uprightPoint(
          { x: p.x - center.x, y: p.y - center.y },
          Rotation.CLOCKWISE,
        );
      });
      const local = circles.map((circle) => ({
        ...uprightPoint(
          { x: circle.x - center.x, y: circle.y - center.y },
          Rotation.CLOCKWISE,
        ),
        radius: circle.radius,
      }));
      for (const goods of [0, 1, 2, 3, 4, 8]) {
        for (const bees of [1, 20]) {
          const layout = honeybeeCityGoodsLayout(
            size,
            goods,
            bees,
            centers,
            city.goodColors()[0],
            local,
            coord.equals(c(6, 6)),
          );
          expect(layout.bees.reduce((sum, b) => sum + b.count, 0)).toBe(bees);
          if (coord.equals(c(6, 6)) && count < 5 && goods >= 2 && goods <= 4) {
            for (let i = 1; i < goods; i++) {
              expect(layout.goods[i].x - layout.goods[i - 1].x).toBeCloseTo(
                (size / 3) * 0.75,
              );
            }
          }
          expect(layout.goodsSize).toBe(size);
          expect(layout.beeSize).toBeCloseTo((size / 3) * 1.25);
          expect(layout.beeSize / (layout.goodsSize / 3)).toBeCloseTo(1.25);
          const boxes = [
            ...layout.goods.map((p) => ({
              x: p.x - layout.goodsSize / 6,
              y: p.y - layout.goodsSize / 6,
              width: (layout.goodsSize / 3) * 1.3,
              height: (layout.goodsSize / 3) * 1.3,
            })),
            ...layout.bees.map((p) => ({
              ...p,
              width: layout.beeExtent,
              height: layout.beeExtent,
            })),
          ];
          if (coord.equals(c(6, 6))) {
            // Full-size contents must leave the numeral's middle band visible.
            for (const box of boxes) {
              expect(
                box.x + box.width <= -size * 0.16 ||
                  box.x >= size * 0.16 ||
                  box.y + box.height <= size * (goods <= 4 ? -0.1 : -0.13) ||
                  box.y >= size * 0.05,
              ).toBe(true);
            }
          }
          for (const box of boxes) {
            for (const circle of local) {
              const x = Math.max(box.x, Math.min(circle.x, box.x + box.width));
              const y = Math.max(box.y, Math.min(circle.y, box.y + box.height));
              expect(Math.hypot(x - circle.x, y - circle.y)).toBeGreaterThan(
                circle.radius + size * 0.014,
              );
            }
          }
        }
      }
    }
  });
}

it("uses standard cube spacing on peripheral Cities", () => {
  const size = 100;
  for (const goods of [2, 3, 4, 5]) {
    const layout = honeybeeCityGoodsLayout(size, goods, 1);
    for (let i = 1; i < goods; i++) {
      expect(layout.goods[i].x - layout.goods[i - 1].x).toBeCloseTo(
        (size / 3) * 0.75,
      );
      expect(layout.goods[i].y).toBeCloseTo(layout.goods[0].y);
    }
    const rowBottom = layout.goods[0].y - size / 6 + (size / 3) * 1.3;
    for (const bee of layout.bees) {
      expect(bee.y).toBeGreaterThan(rowBottom);
    }
    expect(layout.goodsSize).toBe(size);
    expect(layout.beeSize).toBeCloseTo((size / 3) * 1.25);
  }
});
