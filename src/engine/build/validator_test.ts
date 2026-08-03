import { describe, expect, it } from "vitest";
import { city, plain, town } from "../../testing/factory";
import { InjectionHelper } from "../../testing/injection_helper";
import { resettable } from "../../testing/resettable";
import { Coordinates } from "../../utils/coordinates";
import { GRID, INTER_CITY_CONNECTIONS } from "../game/state";
import { SpaceType } from "../state/location_type";
import { PlayerColor } from "../state/player";
import { MutableSpaceData, SpaceData } from "../state/space";
import { allDirections, Direction, SimpleTileType, TownTileType } from "../state/tile";
import { BuilderHelper } from "./helper";
import { BuildInfo, Validator } from "./validator";

describe('BuildValidator', () => {
  const injector = InjectionHelper.install();

  const validator = resettable(() => new Validator());

  const state = resettable(() => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const plainCoordinates = cityCoordinates.neighbor(Direction.TOP);
    const townCoordinates = plainCoordinates.neighbor(Direction.TOP);
    const grid = new Map<Coordinates, MutableSpaceData>([
      [cityCoordinates, city()],
      [plainCoordinates, plain()],
      [townCoordinates, town()],
      [townCoordinates.neighbor(Direction.TOP), plain()],
    ]);
    injector.state().init(GRID, grid);
    injector.state().init(INTER_CITY_CONNECTIONS, []);
    return {
      cityCoordinates,
      plainCoordinates,
      townCoordinates,
    };
  });

  it("can build a tile off a city", () => {
    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.TOP,
    };
    expect(validator().getInvalidBuildReason(state().plainCoordinates, build))
      .toBe(undefined);
  });

  it("cannot build a tile into unpassable terrain", () => {
    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.CURVE,
      orientation: Direction.TOP_LEFT,
    };
    expect(validator().getInvalidBuildReason(state().plainCoordinates, build))
      .toBe('cannot build towards an unpassable edge');
  });

  it("cannot build a tile into explicitly unpassable terrain", () => {
    const cityCoordinates = Coordinates.ORIGIN;
    const plainCoordinates = cityCoordinates.neighbor(Direction.TOP);
    const unpassableCoordinates = plainCoordinates.neighbor(Direction.TOP);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [plainCoordinates, plain()],
      [unpassableCoordinates, { type: SpaceType.UNPASSABLE }],
    ]));
    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.TOP,
    };
    expect(validator().getInvalidBuildReason(plainCoordinates, build))
      .toBe('cannot build towards an unpassable edge');
  });

  it("cannot build a tile into water terrain", () => {
    const cityCoordinates = Coordinates.ORIGIN;
    const plainCoordinates = cityCoordinates.neighbor(Direction.TOP);
    const unpassableCoordinates = plainCoordinates.neighbor(Direction.TOP);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [plainCoordinates, plain()],
      [unpassableCoordinates, { type: SpaceType.WATER }],
    ]));
    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.TOP,
    };
    expect(validator().getInvalidBuildReason(plainCoordinates, build))
        .toBe('cannot build towards an unpassable edge');
  });

  it("cannot build a tile on unpassable terrain", () => {
    injector.state().set(GRID, new Map());
    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.CURVE,
      orientation: Direction.TOP_LEFT,
    };
    expect(validator().getInvalidBuildReason(Coordinates.ORIGIN, build))
      .toBe('cannot build on unpassable terrain');
  });

  it("cannot build a tile on explicitly unpassable terrain", () => {
    const coordinates = Coordinates.ORIGIN;
    injector.state().set(GRID, new Map([[coordinates, { type: SpaceType.UNPASSABLE } as const]]));
    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.CURVE,
      orientation: Direction.TOP_LEFT,
    };
    expect(validator().getInvalidBuildReason(coordinates, build))
      .toBe('cannot build on unpassable terrain');
  });

  it("cannot build a tile on water terrain", () => {
    const coordinates = Coordinates.ORIGIN;
    injector.state().set(GRID, new Map([[coordinates, { type: SpaceType.WATER } as const]]));
    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.CURVE,
      orientation: Direction.TOP_LEFT,
    };
    expect(validator().getInvalidBuildReason(coordinates, build))
        .toBe('cannot build on unpassable terrain');
  });

  it("cannot build an unavailable tile", () => {
    injector.spyOn(BuilderHelper, 'tileAvailableInManifest').mockReturnValue(false);
    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.TOP,
    };
    expect(validator().getInvalidBuildReason(state().plainCoordinates, build))
      .toBe('tile unavailable');
  });

  it("cannot place a town track on a non-town-tile", () => {
    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: TownTileType.LOLLYPOP,
      orientation: Direction.BOTTOM,
    };
    expect(validator().getInvalidBuildReason(state().plainCoordinates, build))
      .toBe('cannot place town track on a non-town tile');
  });

  it("cannot place regular track on a town-tile", () => {
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      ...injector.state().get(GRID),
      [state().plainCoordinates, ({
        type: SpaceType.PLAIN,
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
    ]));
    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.BOTTOM,
    };
    expect(validator().getInvalidBuildReason(state().townCoordinates, build))
      .toBe('cannot place regular track on a town tile');
  });

  it('cannot reroute a town track', () => {
    const townCoordinates = Coordinates.from({ q: 0, r: 0 });
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [townCoordinates, town({
        tile: {
          tileType: TownTileType.LOLLYPOP,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      ...allDirections.map((dir) => [townCoordinates.neighbor(dir), plain()] as [Coordinates, SpaceData]),
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: TownTileType.LOLLYPOP,
      orientation: Direction.BOTTOM,
    };

    expect(validator().getInvalidBuildReason(townCoordinates, build))
      .toBe('must preserve previous track');
  });

  it('can reroute their own track', () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.TIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [trackCoordinates.neighbor(Direction.TOP_LEFT), plain()],
      [trackCoordinates.neighbor(Direction.TOP_RIGHT), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.TIGHT,
      orientation: Direction.TOP_RIGHT,
    };

    expect(validator().getInvalidBuildReason(trackCoordinates, build))
      .toBe(undefined);
  });

  it(`cannot reroute someone else's track`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.TIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [trackCoordinates.neighbor(Direction.TOP_LEFT), plain()],
      [trackCoordinates.neighbor(Direction.TOP_RIGHT), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.GREEN,
      tileType: SimpleTileType.TIGHT,
      orientation: Direction.TOP_RIGHT,
    };

    expect(validator().getInvalidBuildReason(trackCoordinates, build))
      .toBe(`cannot reroute another player's track`);
  });

  it(`cannot reroute a track that has extended`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    const extensionCoordinates = trackCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [extensionCoordinates, plain({
        tile: {
          tileType: SimpleTileType.CURVE,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [extensionCoordinates.neighbor(Direction.BOTTOM_LEFT), plain()],
      [trackCoordinates.neighbor(Direction.BOTTOM_LEFT), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.CURVE,
      orientation: Direction.TOP,
    };

    expect(validator().getInvalidBuildReason(trackCoordinates, build))
      .toBe(`cannot change non-dangling track`);
  });

  it(`cannot reroute a track that connects to cities`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [trackCoordinates.neighbor(Direction.BOTTOM), city()],
      [trackCoordinates.neighbor(Direction.BOTTOM_LEFT), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.CURVE,
      orientation: Direction.TOP,
    };

    expect(validator().getInvalidBuildReason(trackCoordinates, build))
      .toBe(`cannot change non-dangling track`);
  });

  it(`cannot build a track that is a noop`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [trackCoordinates.neighbor(Direction.BOTTOM), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.TOP,
    };

    expect(validator().getInvalidBuildReason(trackCoordinates, build))
      .toBe(`must build or reroute track`);
  });

  it(`cannot build a track that is a noop reversed`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [trackCoordinates.neighbor(Direction.BOTTOM), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.BOTTOM,
    };

    expect(validator().getInvalidBuildReason(trackCoordinates, build))
      .toBe(`must build or reroute track`);
  });

  it(`cannot just drop track`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP_LEFT,
          owners: [PlayerColor.GREEN],
        },
      })],
      [trackCoordinates.neighbor(Direction.BOTTOM), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.BOTTOM,
    };

    expect(validator().getInvalidBuildReason(trackCoordinates, build))
      .toBe(`must preserve previous track`);
  });

  it(`can extend their own track`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    const extensionCoordinates = trackCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [extensionCoordinates, plain()],
      [extensionCoordinates.neighbor(Direction.BOTTOM), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.BOTTOM,
    };

    expect(validator().getInvalidBuildReason(extensionCoordinates, build))
      .toBe(undefined);
  });

  it(`can connect their own track`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    const extensionCoordinates = trackCoordinates.neighbor(Direction.BOTTOM);
    const otherTrackCoordinates = extensionCoordinates.neighbor(Direction.BOTTOM);
    const otherCityCoordinates = otherTrackCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [extensionCoordinates, plain()],
      [otherTrackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [otherCityCoordinates, city()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.BOTTOM,
    };

    expect(validator().getInvalidBuildReason(extensionCoordinates, build))
      .toBe(undefined);
  });

  it(`cannot extend someone else's track`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    const extensionCoordinates = trackCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP_LEFT,
          owners: [PlayerColor.GREEN],
        },
      })],
      [extensionCoordinates, plain()],
      [extensionCoordinates.neighbor(Direction.BOTTOM), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.BOTTOM,
    };

    expect(validator().getInvalidBuildReason(extensionCoordinates, build))
      .toBe(`new track must come off a city or extend previous track`);
  });

  it(`cannot point to someone else's track`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    const extensionCoordinates = trackCoordinates.neighbor(Direction.BOTTOM);
    const otherTrackCoordinates = extensionCoordinates.neighbor(Direction.BOTTOM);
    const otherCityCoordinates = otherTrackCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [extensionCoordinates, plain()],
      [otherTrackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.GREEN],
        },
      })],
      [otherCityCoordinates, city()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.BOTTOM,
    };

    expect(validator().getInvalidBuildReason(extensionCoordinates, build))
      .toBe(`new track cannot connect to another player's track`);
  });

  it(`cannot point to someone else's track w/ rerouted track`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    const extensionCoordinates = trackCoordinates.neighbor(Direction.BOTTOM);
    const otherTrackCoordinates = extensionCoordinates.neighbor(Direction.BOTTOM);
    const otherCityCoordinates = otherTrackCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [extensionCoordinates, plain({
        tile: {
          tileType: SimpleTileType.CURVE,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [otherTrackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.GREEN],
        },
      })],
      [otherCityCoordinates, city()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.BOTTOM,
    };

    expect(validator().getInvalidBuildReason(extensionCoordinates, build))
      .toBe(`new track cannot connect to another player's track`);
  });

  it(`cannot create a circular loop w/ a city`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    const extensionCoordinates = trackCoordinates.neighbor(Direction.TOP_LEFT);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.TIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [extensionCoordinates, plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.TIGHT,
      orientation: Direction.BOTTOM_RIGHT,
    };

    expect(validator().getInvalidBuildReason(extensionCoordinates, build))
      .toBe(`cannot create a loop back to the same location`);
  });

  it(`cannot pass through an unpassable edge`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const extensionCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [extensionCoordinates, plain({
        unpassableEdges: [Direction.TOP_LEFT],
      })],
      [extensionCoordinates.neighbor(Direction.TOP_LEFT), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.TIGHT,
      orientation: Direction.TOP,
    };

    expect(validator().getInvalidBuildReason(extensionCoordinates, build))
      .toBe(`cannot build towards an unpassable edge`);
  });

  it(`cannot create a circular loop w/ a town`, () => {
    const townCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = townCoordinates.neighbor(Direction.BOTTOM);
    const extensionCoordinates = townCoordinates.neighbor(Direction.BOTTOM_LEFT);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [townCoordinates, town({
        tile: {
          tileType: TownTileType.LOLLYPOP,
          orientation: Direction.BOTTOM,
          owners: [PlayerColor.BLUE],
        },
      })],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.TIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [extensionCoordinates, plain({
        tile: {
          tileType: SimpleTileType.TIGHT,
          orientation: Direction.BOTTOM_RIGHT,
          owners: [PlayerColor.BLUE],
        },
      })],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: TownTileType.TIGHT,
      orientation: Direction.BOTTOM_LEFT,
    };

    expect(validator().getInvalidBuildReason(townCoordinates, build))
      .toBe(`cannot create a loop back to the same location`);
  });

  it(`cannot create a circular loop connecting to a town`, () => {
    const townCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = townCoordinates.neighbor(Direction.BOTTOM);
    const extensionCoordinates = townCoordinates.neighbor(Direction.BOTTOM_LEFT);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [townCoordinates, town({
        tile: {
          tileType: TownTileType.TIGHT,
          orientation: Direction.BOTTOM_LEFT,
          owners: [PlayerColor.BLUE],
        },
      })],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.TIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [extensionCoordinates, plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.TIGHT,
      orientation: Direction.BOTTOM_RIGHT,
    };

    expect(validator().getInvalidBuildReason(extensionCoordinates, build))
      .toBe(`cannot create a loop back to the same location`);
  });

  it(`can extend an unowned route from a city`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    const extensionCoordinates = trackCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [undefined],
        },
      })],
      [extensionCoordinates, plain()],
      [extensionCoordinates.neighbor(Direction.BOTTOM), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.TOP,
    };

    expect(validator().getInvalidBuildReason(extensionCoordinates, build))
      .toBe(undefined);
  });

  it(`can reroute an unowned route from a city`, () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    const extensionCoordinates = trackCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.CURVE,
          orientation: Direction.TOP,
          owners: [undefined],
        },
      })],
      [extensionCoordinates, plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.TOP,
    };

    expect(validator().getInvalidBuildReason(trackCoordinates, build))
      .toBe(undefined);
  });

  it(`can extend an unowned route from a town you connect to`, () => {
    const townCoordinates = Coordinates.from({ q: 0, r: 0 });
    const extensionCoordinates = townCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [townCoordinates, town({
        tile: {
          tileType: TownTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE, undefined],
        },
      })],
      [extensionCoordinates, plain()],
      [extensionCoordinates.neighbor(Direction.BOTTOM), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.TOP,
    };

    expect(validator().getInvalidBuildReason(extensionCoordinates, build))
      .toBe(undefined);
  });

  it(`can reroute an unowned route from a town you connect to`, () => {
    const townCoordinates = Coordinates.from({ q: 0, r: 0 });
    const extensionCoordinates = townCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [townCoordinates, town({
        tile: {
          tileType: TownTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE, undefined],
        },
      })],
      [extensionCoordinates, plain({
        tile: {
          tileType: SimpleTileType.CURVE,
          orientation: Direction.TOP,
          owners: [undefined],
        },
      })],
      [extensionCoordinates.neighbor(Direction.BOTTOM), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.TOP,
    };

    expect(validator().getInvalidBuildReason(extensionCoordinates, build))
      .toBe(undefined);
  });

  it(`cannot extend an unowned route from a town you do not connect to`, () => {
    const townCoordinates = Coordinates.from({ q: 0, r: 0 });
    const extensionCoordinates = townCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [townCoordinates, town({
        tile: {
          tileType: TownTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.GREEN, undefined],
        },
      })],
      [extensionCoordinates, plain()],
      [extensionCoordinates.neighbor(Direction.BOTTOM), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.TOP,
    };

    expect(validator().getInvalidBuildReason(extensionCoordinates, build))
      .toBe(`new track must come off a city or extend previous track`);
  });

  it(`cannot reroute an unowned route from a town you do not connect to`, () => {
    const townCoordinates = Coordinates.from({ q: 0, r: 0 });
    const extensionCoordinates = townCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [townCoordinates, town({
        tile: {
          tileType: TownTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.GREEN, undefined],
        },
      })],
      [extensionCoordinates, plain({
        tile: {
          tileType: SimpleTileType.CURVE,
          orientation: Direction.TOP,
          owners: [undefined],
        },
      })],
      [extensionCoordinates.neighbor(Direction.BOTTOM), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.TOP,
    };

    expect(validator().getInvalidBuildReason(extensionCoordinates, build))
      .toBe(`new track must come off a city or extend previous track`);
  });

  it('can add track to a town by connecting to it', () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    const extensionCoordinates = trackCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [undefined],
        },
      })],
      [extensionCoordinates, town({
        tile: {
          tileType: TownTileType.LEFT_LEANER,
          orientation: Direction.TOP_LEFT,
          owners: [PlayerColor.GREEN, PlayerColor.GREEN, PlayerColor.GREEN],
        },
      })],
      [extensionCoordinates.neighbor(Direction.TOP_RIGHT), plain()],
      [extensionCoordinates.neighbor(Direction.TOP_LEFT), plain()],
      [extensionCoordinates.neighbor(Direction.BOTTOM_LEFT), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: TownTileType.CHICKEN_FOOT,
      orientation: Direction.BOTTOM_RIGHT,
    };

    expect(validator().getInvalidBuildReason(extensionCoordinates, build))
      .toBe(undefined);
  });

  it('can take ownership of unowned town track', () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    const extensionCoordinates = trackCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain()],
      [extensionCoordinates, town({
        tile: {
          tileType: TownTileType.LOLLYPOP,
          orientation: Direction.TOP,
          owners: [undefined],
        },
      })],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.TOP,
    };

    expect(validator().getInvalidBuildReason(trackCoordinates, build))
      .toBe(undefined);
  });

  it('can build more track off a town where I have track', () => {
    const townCoordinates = Coordinates.from({ q: 0, r: 0 });
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [townCoordinates, town({
        tile: {
          tileType: TownTileType.LOLLYPOP,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [townCoordinates.neighbor(Direction.TOP), plain()],
      [townCoordinates.neighbor(Direction.BOTTOM), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: TownTileType.STRAIGHT,
      orientation: Direction.TOP,
    };

    expect(validator().getInvalidBuildReason(townCoordinates, build))
      .toBe(undefined);
  });

  it('cannot build more track off a town where I have no track', () => {
    const townCoordinates = Coordinates.from({ q: 0, r: 0 });
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [townCoordinates, town({
        tile: {
          tileType: TownTileType.LOLLYPOP,
          orientation: Direction.TOP,
          owners: [PlayerColor.GREEN],
        },
      })],
      [townCoordinates.neighbor(Direction.TOP), plain()],
      [townCoordinates.neighbor(Direction.BOTTOM), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: TownTileType.STRAIGHT,
      orientation: Direction.TOP,
    };

    expect(validator().getInvalidBuildReason(townCoordinates, build))
      .toBe(`new track must come off a city or extend previous track`);
  });

  it('can build new town track with multiple exits', () => {
    const cityCoordinates = Coordinates.from({ q: 0, r: 0 });
    const trackCoordinates = cityCoordinates.neighbor(Direction.BOTTOM);
    const townCoordinates = trackCoordinates.neighbor(Direction.BOTTOM);
    injector.state().set(GRID, new Map<Coordinates, SpaceData>([
      [cityCoordinates, city()],
      [trackCoordinates, plain({
        tile: {
          tileType: SimpleTileType.STRAIGHT,
          orientation: Direction.TOP,
          owners: [PlayerColor.BLUE],
        },
      })],
      [townCoordinates, town()],
      [townCoordinates.neighbor(Direction.BOTTOM), plain()],
    ]));

    const build: BuildInfo = {
      playerColor: PlayerColor.BLUE,
      tileType: TownTileType.STRAIGHT,
      orientation: Direction.TOP,
    };

    expect(validator().getInvalidBuildReason(townCoordinates, build))
      .toBe(undefined);
  });
});
