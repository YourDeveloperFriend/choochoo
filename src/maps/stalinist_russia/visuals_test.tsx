import { afterAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ClickTarget } from "../../client/grid/click_target";
import { getTerrainHexes } from "../../client/grid/hex";
import { Rotation } from "../../engine/game/map_settings";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { Land } from "../../engine/map/location";
import { SpaceType } from "../../engine/state/location_type";
import { Good } from "../../engine/state/good";
import { Direction, TownTileType } from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";
import { black, city, white } from "../factory";
import { StalinistRussiaRivers } from "./rivers";
import { StalinistRussiaViewSettings } from "./view_settings";

vi.hoisted(() => {
  process.env.SOCKET_HOST = "http://localhost";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ json: async () => ({ xsrfToken: "preview-test" }) })),
  );
});
afterAll(() => vi.unstubAllGlobals());

const settings = new StalinistRussiaViewSettings();
const coordinates = Coordinates.from({ q: 0, r: 0 });
const targets = new Set([
  ClickTarget.CITY,
  ClickTarget.GOOD,
  ClickTarget.TOWN,
  ClickTarget.LAND,
]);

function render(
  space: City | Land,
  gameKey: "stalinist-russia" | "maui" = settings.key,
) {
  const layers = getTerrainHexes({
    space,
    gameKey,
    size: 70,
    isHighlighted: false,
    clickTargets: targets,
  });
  return renderToStaticMarkup(
    <svg>
      {layers.beforeTextures}
      {layers.afterTextures}
      {layers.afterOverlay}
    </svg>,
  );
}

function moscow(goods: Good[]) {
  return new City(coordinates, { ...city("Moscow", []), goods });
}

describe("Stalinist Russia map visuals", () => {
  it("includes the title in the background texture layer before rivers", () => {
    const markup = renderToStaticMarkup(
      <svg>
        <StalinistRussiaRivers />
      </svg>,
    );
    expect(markup).toContain("/static/maps/stalinist-russia/title.svg");
    expect(markup).toContain('pointer-events="none"');
    expect(markup.indexOf("<image")).toBeLessThan(markup.indexOf("<path"));
  });
  it("keeps Moscow's five slots fixed and exposes only stored cubes as goods targets", () => {
    for (const goods of [
      [],
      [Good.BLUE, Good.PURPLE],
      [Good.BLACK, Good.BLUE, Good.YELLOW, Good.RED, Good.PURPLE],
    ]) {
      const markup = render(moscow(goods));
      expect(markup.match(/data-moscow-slot=/g)).toHaveLength(5);
      expect(markup.match(/data-occupied="true"/g) ?? []).toHaveLength(
        goods.length,
      );
      expect(markup.match(/data-good=/g) ?? []).toHaveLength(goods.length);
      for (const good of goods) {
        expect(markup).toContain(`data-good="${good}"`);
      }
      expect(markup).toContain("moscow.svg");
      expect(markup).toContain("Москва");
    }
  });

  it("uses the map rendering for a standalone available New City F", () => {
    const newCity = new City(coordinates, {
      ...city("", Good.PURPLE, black(2)),
      urbanized: true,
      goods: [Good.RED, Good.YELLOW],
    });
    const markup = render(newCity);
    expect(markup).toContain("New City F");
    expect(markup.match(/>F<\/text>/g)).toHaveLength(1);
    expect(markup).toContain('data-unplaced-city-letter="F"');
    expect(markup).not.toContain("cityscape.svg");
    expect(markup).not.toContain('fill="#222222"');
    expect(markup).not.toContain(">New City F</text>");
    expect(markup).toContain('stroke="#3d2146"');
    expect(markup).toContain("#ba8fc2");
    expect(markup.match(/data-good=/g)).toHaveLength(2);
    expect(markup).not.toContain("textPath");
  });

  it("matches standard cube size and horizontal spacing outside Moscow", () => {
    const space = new City(coordinates, {
      ...city("Kursk", Good.BLUE, black(2)),
      goods: [
        Good.RED,
        Good.BLUE,
        Good.YELLOW,
        Good.PURPLE,
        Good.BLACK,
        Good.BLUE,
      ],
    });
    const rects = (markup: string): string[] =>
      markup.match(/<rect[^>]*data-good=[^>]*>/g) ?? [];
    const attribute = (rect: string, name: string) =>
      Number(rect.match(new RegExp(`\\b${name}="([^"]+)"`))![1]);
    const custom = rects(render(space));
    const standard = rects(render(space, "maui"));
    const singleMarkup = render(
      new City(coordinates, {
        ...space.data,
        goods: space.getGoods().slice(0, 5),
      }),
    );
    const singleCube = rects(singleMarkup)[0];
    const badge = singleMarkup.match(/<rect[^>]*fill="#222222"[^>]*>/)![0];
    const cubeBottom =
      attribute(singleCube, "y") + attribute(singleCube, "width") * 1.3;
    const gap = attribute(badge, "y") - cubeBottom;
    expect(gap).toBeGreaterThan(1);
    expect(gap).toBeLessThan(3);

    expect(custom).toHaveLength(standard.length);
    for (let index = 0; index < custom.length; index++) {
      expect(attribute(custom[index], "width")).toBe(
        attribute(standard[index], "width"),
      );
      expect(attribute(custom[index], "height")).toBe(
        attribute(standard[index], "height"),
      );
    }
    expect(attribute(custom[1], "x") - attribute(custom[0], "x")).toBeCloseTo(
      attribute(standard[1], "x") - attribute(standard[0], "x"),
    );
  });

  it("enlarges stored Moscow cubes beyond their muted empty slots", () => {
    const markup = render(moscow([Good.BLUE]));
    const cube = markup.match(/<rect[^>]*data-good="0"[^>]*>/)![0];
    const width = Number(cube.match(/width="([^"]+)"/)![1]);
    expect(width).toBeCloseTo((70 * 0.75) / 3);
    expect(width).toBeGreaterThan(70 * 0.21);
    expect(markup).toContain('fill="#c9c5c0"');
    expect(markup).toContain('fill-opacity="0.5"');
  });

  it("adds the skyline and town name after a New City is urbanized", () => {
    const placed = new City(coordinates, {
      ...city("Kursk", Good.PURPLE, black(2)),
      urbanized: true,
      goods: [Good.BLUE],
    });
    const markup = render(placed);
    expect(markup).toContain("cityscape.svg");
    expect(markup).toContain(">Kursk</text>");
    expect(markup).toContain(">F</text>");
    expect(markup).not.toContain("data-unplaced-city-letter");
  });

  it("retains all goods when a city has several rows of cubes", () => {
    const goods = Array.from(
      { length: 10 },
      (_, index) => [Good.BLUE, Good.RED, Good.YELLOW][index % 3],
    );
    const markup = render(
      new City(coordinates, {
        ...city("Kursk", Good.BLUE, black(2)),
        goods,
        urbanized: true,
      }),
    );
    expect(markup.match(/data-good=/g)).toHaveLength(goods.length);
    expect(markup).toContain("Курск");
    expect(markup).not.toMatch(/NaN|Infinity/);
  });

  it("uses white skylines and black Cyrillic on black-colored starting and urbanized Cities", () => {
    const cases = [
      { name: "Minsk", roll: white(2), urbanized: false },
      { name: "Arkhangelsk", roll: black(1), urbanized: false },
      { name: "Ulyanovsk", roll: black(3), urbanized: false },
      { name: "Kursk", roll: white(5), urbanized: true },
      { name: "Kursk", roll: white(6), urbanized: true },
      { name: "Kursk", roll: black(3), urbanized: true },
      { name: "Kursk", roll: black(4), urbanized: true },
    ];
    for (const { name, roll, urbanized } of cases) {
      const markup = render(
        new City(coordinates, { ...city(name, Good.BLACK, roll), urbanized }),
      );
      expect(markup).toContain('style="filter:invert(1)"');
      expect(markup).toMatch(/fill="#171717">[А-Яа-я ]+<\/text>/);
    }
    const colored = render(
      new City(coordinates, city("Tula", Good.YELLOW, white(3))),
    );
    expect(colored).not.toContain("filter:invert(1)");
    expect(colored).toContain('fill="#ffffff">Тула</text>');
  });

  it("renders straight bilingual labels for every starting city and town", () => {
    const grid = Grid.fromData(settings, settings.startingGrid, []);
    for (const space of grid.values()) {
      if (!(space instanceof City) && !space.hasTown()) {
        continue;
      }
      const markup = render(space);
      expect(markup).toMatch(/[А-Яа-я]/);
      expect(markup).not.toContain("textPath");
    }
  });

  it("retains the town star, labels and track after construction", () => {
    const town = new Land(coordinates, {
      type: SpaceType.RIVER,
      townName: "Dnipropetrovsk",
      tile: {
        tileType: TownTileType.X,
        orientation: Direction.TOP,
        owners: [undefined],
      },
    });
    const markup = render(town);
    expect(markup).toContain("data-tile-type");
    expect(markup).toContain("town-star.svg");
    expect(markup).toContain("Днепропетровск");
  });

  it("keeps the default city renderer for other maps", () => {
    const markup = render(
      new City(coordinates, city("Default city", Good.BLUE, black(2))),
      "maui",
    );
    expect(markup).toContain("textPath");
    expect(markup).not.toContain("cityscape.svg");
    expect(markup).not.toContain("data-stalin-city");
  });

  it("counter-rotates the custom labels and stored cubes with the map", () => {
    const space = moscow([Good.BLUE]);
    const layers = getTerrainHexes({
      space,
      gameKey: settings.key,
      size: 70,
      rotation: Rotation.CLOCKWISE,
      isHighlighted: false,
      clickTargets: targets,
    });
    const markup = renderToStaticMarkup(
      <svg>
        {layers.afterTextures}
        {layers.afterOverlay}
      </svg>,
    );
    expect(markup.match(/rotate\(-90/g)).toHaveLength(2);
    expect(markup.match(/data-good=/g)).toHaveLength(1);
  });
});
