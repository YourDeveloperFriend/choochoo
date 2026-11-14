import { getTerrainHexes } from "../../client/grid/hex";
import { GoodBlock as TableGoodBlock } from "../../client/game/goods_table";
import { FloatingGoodBlock } from "../../client/grid/good_block";
import { HoneybeeHiveMindViewSettings } from "./view_settings";
import { HoneybeeDeliveryReview } from "./move_intercept_modal";
import {
  WagglePreviewContext,
  waggleMoveKey,
  waggleSourcesRemaining,
} from "./waggle_preview";
import { waggleDestinations } from "./waggle_view";
import { InterCityConnectionsRender } from "../../client/grid/inter_city_connection";
import { ClickTarget } from "../../client/grid/click_target";
import { getPlayerColorCss } from "../../client/components/player_color";
import * as gridStyles from "../../client/grid/hex_grid.module.css";
import { PlayerColor } from "../../engine/state/player";
import { connectionsForPlayers } from "./connections";
import { afterAll, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { CityGroup } from "../../engine/state/city_group";
import { Rotation } from "../../engine/game/map_settings";
import { coordinatesToCenter } from "../../utils/point";
import { HoneybeeHiveMindMapSettings } from "./settings";
import { HoneybeeCity } from "./city_visuals";
import { HoneybeeCityGoods } from "./city_goods";
import { honeybeeCityDisplayName } from "./city_geometry";
import { boardCoordinates as c } from "./grid";

// Isolate the client transport bootstrap in Node. Game context and rendering
// hooks remain real and deliberately have no provider.
vi.hoisted(() => {
  process.env.SOCKET_HOST = "http://localhost";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      json: async () => ({ xsrfToken: "standalone-preview-test" }),
    })),
  );
});
// Stable class names let this Node rendering check distinguish interactive slots.
vi.mock("../../client/grid/hex_grid.module.css", () => ({
  clickable: "clickable",
}));
vi.mock("../../client/components/player_color.module.css", () => ({
  pink: "pink",
}));
afterAll(() => vi.unstubAllGlobals());
const settings = new HoneybeeHiveMindMapSettings();

it("renders a standalone Honeybee preview without any active-game provider or mocked hooks", () => {
  for (const populated of [false, true]) {
    const data = populated
      ? settings.startingGrid.map((space) =>
          space.type === SpaceType.CITY
            ? { ...space, goods: [Good.RED, Good.YELLOW] }
            : space,
        )
      : settings.startingGrid;
    const grid = Grid.fromData(settings, data, settings.interCityConnections);
    const markup = renderToStaticMarkup(
      <svg>
        {grid.cities().map((city) => (
          <g key={city.coordinates.serialize()}>
            <HoneybeeCity
              grid={grid}
              city={city}
              size={70}
              rotation={Rotation.CLOCKWISE}
              clickable={false}
              highlighted={false}
            />
            <HoneybeeCityGoods
              grid={grid}
              city={city}
              center={coordinatesToCenter(city.coordinates, 70)}
              size={70}
              rotation={Rotation.CLOCKWISE}
              clickable={false}
            />
          </g>
        ))}
      </svg>,
    );
    expect(markup.match(/data-honeybee-city=/g) || []).toHaveLength(12);
    expect(markup.match(/data-city-hex-count="2"/g) || []).toHaveLength(3);
    if (populated) {
      expect(markup).toContain("Bee swarm (yellow good)");
    }
  }
});

it("renders an Available City using its standalone holder grid", () => {
  const city = new City(c(0, 0), {
    type: SpaceType.CITY,
    name: "",
    color: Good.RED,
    goods: [Good.BLUE],
    urbanized: true,
    onRoll: [{ group: CityGroup.WHITE, onRoll: 3, goods: [] }],
  });
  const grid = Grid.fromSpaces(settings, [city], []);
  const markup = renderToStaticMarkup(
    <svg>
      <HoneybeeCity
        grid={grid}
        city={city}
        size={70}
        clickable={false}
        highlighted={false}
      />
      <HoneybeeCityGoods
        grid={grid}
        city={city}
        center={coordinatesToCenter(city.coordinates, 70)}
        size={70}
        clickable={false}
      />
    </svg>,
  );
  expect(markup).toContain(">A</text>");
  expect(markup).toContain('data-city-hex-count="1"');
});

it("labels an unnamed urbanized destination with its letter and coordinates", () => {
  const coord = c(0, 0);
  const grid = Grid.fromData(
    settings,
    settings.startingGrid.set(coord, {
      type: SpaceType.CITY,
      name: "",
      color: Good.RED,
      goods: [],
      urbanized: true,
      onRoll: [{ group: CityGroup.WHITE, onRoll: 3, goods: [] }],
    }),
    [],
  );
  expect(honeybeeCityDisplayName(grid, coord)).toBe(
    `City A (${grid.toDoubleHeightDisplay(coord).toString()})`,
  );
  expect(honeybeeCityDisplayName(grid, c(6, 6))).toBe(
    grid.displayName(c(6, 6)),
  );
});

it("keeps claimed interurbans in the owner's full color and only vacant build slots clickable", () => {
  for (const count of [3, 4, 5]) {
    const connections = connectionsForPlayers(count).map((connection, index) =>
      index === 0
        ? { ...connection, owner: { color: PlayerColor.PINK } }
        : connection,
    );
    const render = (clickTargets: Set<ClickTarget>) =>
      renderToStaticMarkup(
        <svg>
          <InterCityConnectionsRender
            connections={connections}
            size={70}
            fillOpacity={0.35}
            clickTargets={clickTargets}
            onClick={() => {}}
          />
        </svg>,
      );
    const markup = render(new Set([ClickTarget.INTER_CITY_CONNECTION]));
    const circles = markup.match(
      /<circle[^>]*data-inter-city-connection[^>]*>/g,
    )!;
    expect(circles).toHaveLength(count === 5 ? 21 : 12);
    expect(circles[0]).toContain('fill-opacity="1"');
    expect(circles[0]).toContain(getPlayerColorCss(PlayerColor.PINK));
    expect(circles[0]).not.toContain(gridStyles.clickable);
    expect(circles[1]).toContain('fill-opacity="0.35"');
    expect(circles[1]).toContain(gridStyles.clickable);
    expect(markup.match(/\$2/g)).toHaveLength(connections.length - 1);
    // During delivery, markers don't intercept the existing City route clicks.
    const deliveryMarkup = render(new Set([ClickTarget.CITY]));
    expect(deliveryMarkup).not.toContain(gridStyles.clickable);
  }
});

it("highlights distinct legal Waggle destinations across both halves and never reuses arrivals", () => {
  const grid = Grid.fromData(
    settings,
    settings.startingGrid.map((space) => ({
      ...space,
      goods:
        space.type === SpaceType.CITY && space.sameCity === 1
          ? [Good.YELLOW]
          : [],
    })),
    settings.interCityConnections,
  );
  const source = grid.get(c(5, 5)) as City;
  const otherHalf = grid.get(c(5, 6)) as City;
  const destination = grid.get(c(6, 6)) as City;
  const secondDestination = grid.get(c(6, 5)) as City;
  expect(waggleSourcesRemaining(grid, otherHalf, [])).toBe(2);
  expect(
    waggleDestinations(grid, source, []).some((city) =>
      city.isSameCity(source),
    ),
  ).toBe(false);
  const moves = [{ from: otherHalf.coordinates, to: destination.coordinates }];
  expect(waggleSourcesRemaining(grid, source, moves)).toBe(1);
  expect(
    waggleDestinations(grid, otherHalf, moves).some((city) =>
      city.isSameCity(destination),
    ),
  ).toBe(false);
  expect(waggleSourcesRemaining(grid, destination, moves)).toBe(0);
  expect(waggleDestinations(grid, destination, moves)).toEqual([]);
  const spent = [
    ...moves,
    { from: source.coordinates, to: secondDestination.coordinates },
  ];
  expect(waggleDestinations(grid, source, spent)).toEqual([]);
});

it("removes a staged swarm from its origin and renders it at its destination after landing, with Undo restoring both", () => {
  const originCoord = c(5, 5),
    destinationCoord = c(6, 6);
  const grid = Grid.fromData(
    settings,
    settings.startingGrid.map((space, coord) => ({
      ...space,
      goods: coord.equals(originCoord) ? [Good.YELLOW] : [],
    })),
    settings.interCityConnections,
  );
  const move = { from: originCoord, to: destinationCoord };
  const render = (
    coord: typeof originCoord,
    moves: (typeof move)[],
    landed: string[],
  ) =>
    renderToStaticMarkup(
      <WagglePreviewContext.Provider value={{ moves, landed }}>
        <svg>
          <HoneybeeCityGoods
            grid={grid}
            city={grid.get(coord) as City}
            center={coordinatesToCenter(coord, 70)}
            size={70}
            clickable={false}
          />
        </svg>
      </WagglePreviewContext.Provider>,
    );
  expect(render(originCoord, [], [])).toContain('aria-label="1 bee swarm"');
  expect(render(originCoord, [move], [])).not.toContain(
    'aria-label="1 bee swarm"',
  );
  expect(render(destinationCoord, [move], [])).not.toContain(
    'aria-label="1 bee swarm"',
  );
  expect(render(destinationCoord, [move], [waggleMoveKey(move)])).toContain(
    'aria-label="1 bee swarm"',
  );
  expect(render(originCoord, [], [waggleMoveKey(move)])).toContain(
    'aria-label="1 bee swarm"',
  );
  expect(render(destinationCoord, [], [waggleMoveKey(move)])).not.toContain(
    'aria-label="1 bee swarm"',
  );
  expect((grid.get(originCoord) as City).getGoods()).toEqual([Good.YELLOW]);
});

it("makes only original movable bees selectable and highlights the selected bee", () => {
  const origin = c(5, 5),
    destination = c(6, 6);
  const grid = Grid.fromData(
    settings,
    settings.startingGrid.map((space, coord) => ({
      ...space,
      goods: coord.equals(origin) ? [Good.YELLOW] : [],
    })),
    settings.interCityConnections,
  );
  const move = { from: origin, to: destination };
  const render = (
    coord: typeof origin,
    moves: (typeof move)[],
    landed: string[],
    selected = false,
  ) =>
    renderToStaticMarkup(
      <WagglePreviewContext.Provider
        value={{
          moves,
          landed,
          selectBee: () => {},
          source: selected ? origin : undefined,
          selectedBee: selected ? 0 : undefined,
        }}
      >
        <svg>
          <HoneybeeCityGoods
            grid={grid}
            city={grid.get(coord) as City}
            center={coordinatesToCenter(coord, 70)}
            size={70}
            clickable={false}
          />
        </svg>
      </WagglePreviewContext.Provider>,
    );
  expect(render(origin, [], [])).toContain(
    'aria-label="Select a movable bee swarm"',
  );
  const selected = render(origin, [], [], true);
  expect(selected).toContain('aria-pressed="true"');
  expect(selected).toContain('stroke="#ffeb3b"');
  expect(render(origin, [move], [])).not.toContain('role="button"');
  expect(render(destination, [move], [waggleMoveKey(move)])).not.toContain(
    'role="button"',
  );
});

it("shows all delivery income recipients but omits fees for Dominant Worker Bee", () => {
  const income = new Map([
    [PlayerColor.RED, 2],
    [PlayerColor.BLUE, 1],
  ]);
  const render = (waived: boolean) =>
    renderToStaticMarkup(
      <HoneybeeDeliveryReview
        fee={waived ? 0 : 3}
        waived={waived}
        income={income}
        player={PlayerColor.RED}
      />,
    );
  for (const waived of [false, true]) {
    expect(render(waived)).toContain("<strong>You</strong> gain 2 income.");
    expect(render(waived)).toContain("<strong>blue</strong> gains 1 income.");
  }
  expect(render(false)).toContain("Bee swarm fee: <strong>$3</strong>");
  expect(render(true)).not.toContain("Bee swarm fee");
  expect(render(true)).not.toContain("$0");
});

it("dispatches shared city hooks with the rendered grid and one compound highlight", () => {
  const view = new HoneybeeHiveMindViewSettings();
  const grid = Grid.fromData(
    view,
    view.startingGrid.map((space) =>
      space.type === SpaceType.CITY
        ? { ...space, goods: [Good.RED, Good.YELLOW] }
        : space,
    ),
    [],
  );
  const city = grid
    .cities()
    .find((city) => grid.getSameCities(city).length === 2)!;
  const halves = grid.getSameCities(city);
  const renderHalf = (half: City, highlighted: boolean, goods = true) => {
    const layers = getTerrainHexes({
      grid,
      space: half,
      gameKey: view.key,
      size: 70,
      rotation: Rotation.CLOCKWISE,
      isHighlighted: highlighted,
      clickTargets: new Set([ClickTarget.CITY, ClickTarget.GOOD]),
      selectedGood: { good: Good.RED, coordinates: halves[1].coordinates },
    });
    return renderToStaticMarkup(
      <svg>
        {layers.beforeTextures}
        {layers.afterTextures}
        {goods && layers.afterOverlay}
      </svg>,
    );
  };
  const markup = halves
    .map((half, index) => renderHalf(half, index === 0))
    .join("");
  expect(markup.match(/data-honeybee-city=/g)).toHaveLength(1);
  expect(markup.match(/data-city-hex-count="2"/g)).toHaveLength(1);
  expect(
    halves
      .map((half, index) => renderHalf(half, index === 0, false))
      .join("")
      .match(/stroke="yellow"/g),
  ).toHaveLength(1);
  expect(markup.match(/Bee swarm \(yellow good\)<\/title>/g)).toHaveLength(2);
  for (const half of halves) {
    expect(markup).toContain(
      `data-coordinates="${half.coordinates.serialize()}" data-good="${Good.RED}"`,
    );
  }
});

it("dispatches an available-city holder through hooks without live-game context", () => {
  const view = new HoneybeeHiveMindViewSettings();
  const city = new City(c(0, 0), {
    type: SpaceType.CITY,
    name: "",
    color: Good.RED,
    goods: [Good.YELLOW],
    urbanized: true,
    onRoll: [{ group: CityGroup.WHITE, onRoll: 3, goods: [] }],
  });
  const grid = Grid.fromSpaces(view, [city], []);
  const layers = getTerrainHexes({
    grid,
    space: city,
    gameKey: view.key,
    size: 70,
    isHighlighted: false,
    clickTargets: new Set(),
  });
  const markup = renderToStaticMarkup(
    <svg>
      {layers.beforeTextures}
      {layers.afterTextures}
      {layers.afterOverlay}
    </svg>,
  );
  expect(markup).toContain(">A</text>");
  expect(markup).toContain('data-city-hex-count="1"');
  expect(markup).toContain("Bee swarm (yellow good)");
});

it("customizes table goods explicitly while default, empty and standalone cubes stay generic", () => {
  const view = new HoneybeeHiveMindViewSettings();
  const visual = view.getGoodsTableVisual(Good.YELLOW);
  expect(view.getGoodsTableVisual(Good.RED)).toBeUndefined();
  const bee = renderToStaticMarkup(
    <TableGoodBlock
      good={Good.YELLOW}
      visual={visual}
      clickable
      onClick={() => {}}
    />,
  );
  expect(bee).toContain("Bee swarm (yellow good)");
  const ordinary = renderToStaticMarkup(<TableGoodBlock good={Good.YELLOW} />);
  expect(ordinary).not.toContain("<svg");
  const empty = renderToStaticMarkup(
    <TableGoodBlock good={Good.YELLOW} visual={visual} emptySpace clickable />,
  );
  expect(empty).not.toContain("<svg");
  const floating = renderToStaticMarkup(
    <svg>
      <FloatingGoodBlock good={Good.YELLOW} center={{ x: 0, y: 0 }} size={70} />
    </svg>,
  );
  expect(floating).toContain("<rect");
  expect(floating).not.toContain("Bee swarm");
});
