import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import {
  injectCurrentPlayer,
  injectGrid,
  injectInitialPlayerCount,
} from "../../engine/game/state";
import { BuildPhase } from "../../engine/build/phase";
import { BuildAction, BuildData } from "../../engine/build/build";
import { ClaimAction, ClaimData } from "../../engine/build/claim";
import {
  ConnectCitiesAction,
  ConnectCitiesData,
} from "../../engine/build/connect_cities";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { Land } from "../../engine/map/location";
import { TOWN, Track } from "../../engine/map/track";
import { InterCityConnection } from "../../engine/state/inter_city_connection";
import { PlayerColor } from "../../engine/state/player";
import { TileData } from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { boardCoordinates as c } from "./grid";
import z from "zod";
import { OrderedMap } from "immutable";

export const PAIRINGS_BEFORE_BUILD = new Key("honeybeePairingsBeforeBuild", {
  parse: z.array(z.string()).parse,
});

export function connectionsForPlayers(count: number): InterCityConnection[] {
  // Use the touching hexes, including secondary halves of the large Cities.
  const pairs: Array<[string, Coordinates, Coordinates, number]> = [
    ["1-2", c(5, 5), c(6, 5), count === 5 ? 3 : 2],
    ["1-3", c(5, 6), c(6, 7), count === 5 ? 3 : 2],
    ["2-3", c(7, 5), c(7, 6), count === 5 ? 3 : 2],
    ["0-1", c(6, 6), c(5, 5), count === 5 ? 4 : 2],
    ["0-2", c(6, 6), c(6, 5), count === 5 ? 4 : 2],
    ["0-3", c(6, 6), c(6, 7), count === 5 ? 4 : 2],
  ];
  return pairs.flatMap(([pair, a, b, slots]) =>
    Array.from({ length: slots }, (_, i) => ({
      id: `${pair}-${i + 1}`,
      connects: [a, b],
      cost: 2,
    })),
  );
}

function centralId(space: unknown): number | undefined {
  if (!(space instanceof City)) {
    return undefined;
  }
  if (space.data.sameCity != null) {
    return space.data.sameCity;
  }
  return space.coordinates.equals(c(6, 6)) ? 0 : undefined;
}

interface Link {
  pair: string;
  owner: PlayerColor;
  id: string;
}

/** Count physical routes once; both halves of a City share the same identity. */
export function centralLinks(grid: Grid): Link[] {
  const links: Link[] = [];
  function add(
    a: unknown,
    b: unknown,
    owner: PlayerColor | undefined,
    id: string,
  ) {
    const one = centralId(a),
      two = centralId(b);
    if (owner == null || one == null || two == null || one === two) {
      return;
    }
    links.push({ pair: [one, two].sort().join("-"), owner, id });
  }
  for (const connection of grid.connections) {
    add(
      grid.get(connection.connects[0]),
      grid.get(connection.connects[1]),
      connection.owner?.color,
      `connection:${connection.id}`,
    );
  }
  const visited = new Set<string>();
  for (const space of grid.values()) {
    if (!(space instanceof Land)) {
      continue;
    }
    for (const track of space.getTrack()) {
      const id = `${track.coordinates.serialize()}:${track.ownerIndex}`;
      if (visited.has(id)) {
        continue;
      }
      const route = grid.getRoute(track);
      for (const part of route) {
        visited.add(`${part.coordinates.serialize()}:${part.ownerIndex}`);
      }
      if (route.some((part) => part.isClaimable())) {
        continue;
      }
      const endpoints = track.getExits().map((exit) => {
        const [end, direction] = grid.getEnd(track, exit);
        return direction === TOWN
          ? undefined
          : grid.get(end.neighbor(direction));
      });
      add(endpoints[0], endpoints[1], track.getOwner(), `track:${id}`);
    }
  }
  return links;
}

export class HoneybeeLinkRules {
  private readonly grid = injectGrid();
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly playerCount = injectInitialPlayerCount();
  private readonly before = injectState(PAIRINGS_BEFORE_BUILD);

  ownedLargePairings(grid = this.grid()): string[] {
    return [
      ...new Set(
        centralLinks(grid)
          .filter(
            (link) =>
              link.owner === this.currentPlayer().color &&
              !link.pair.startsWith("0-"),
          )
          .map((link) => link.pair),
      ),
    ];
  }

  validate(grid: Grid): void {
    const seen = new Set<string>();
    for (const link of centralLinks(grid)) {
      const key = `${link.owner}:${link.pair}`;
      assert(!seen.has(key), {
        invalidInput:
          "You may own only one direct Link per central City pairing, whether claimed or built",
      });
      seen.add(key);
    }
    if (this.playerCount() === 5) {
      const previous = this.before.getOr([]);
      const newPairings = this.ownedLargePairings(grid).filter(
        (pair) => !previous.includes(pair),
      );
      assert(newPairings.length <= 2, {
        invalidInput:
          "You may establish only two large-City pairings per game turn",
      });
    }
  }
}

/** Propagate ownership exactly as a normal build does, without mutating saved state. */
function withRouteOwner(grid: Grid, track: Track, owner: PlayerColor): Grid {
  for (const part of grid.getRoute(track)) {
    const space = grid.get(part.coordinates);
    assert(space instanceof Land);
    const tile = space.getTileData()!;
    const owners = [...tile.owners];
    owners[part.ownerIndex] = owner;
    grid = grid.setSpace(
      part.coordinates,
      new Land(part.coordinates, { ...space.data, tile: { ...tile, owners } }),
    );
  }
  return grid;
}

function withBuild(
  grid: Grid,
  coordinates: Coordinates,
  tile: TileData,
  owner: PlayerColor,
): Grid {
  const old = grid.get(coordinates);
  assert(old instanceof Land);
  grid = grid.setSpace(
    coordinates,
    new Land(coordinates, { ...old.data, tile }),
  );
  const placed = grid.get(coordinates) as Land;
  for (const track of placed.getTrack()) {
    if (track.getOwner() === owner) {
      grid = withRouteOwner(grid, track, owner);
    }
  }
  return grid;
}

export class HoneybeeBuildPhase extends BuildPhase {
  private readonly before = injectState(PAIRINGS_BEFORE_BUILD);
  private readonly rules = inject(HoneybeeLinkRules);
  onStartTurn(): void {
    super.onStartTurn();
    this.before.initState(this.rules.ownedLargePairings());
  }
  onEndTurn(): void {
    super.onEndTurn();
    this.before.delete();
  }
}

export class HoneybeeBuildAction extends BuildAction {
  private readonly rules = inject(HoneybeeLinkRules);
  validate(data: BuildData): void {
    super.validate(data);
    this.rules.validate(
      withBuild(
        this.grid(),
        data.coordinates,
        this.newTile(data),
        this.currentPlayer().color,
      ),
    );
  }
}

export class HoneybeeConnectAction extends ConnectCitiesAction {
  private readonly rules = inject(HoneybeeLinkRules);

  protected logConnection(cities: City[], cost: number): void {
    // Number the three large Cities first, then the central Light 5 City.
    const ordered = [...cities].sort(
      (a, b) => (centralId(a) || 4) - (centralId(b) || 4),
    );
    this.log.currentPlayer(
      `claims an interurban link between ${ordered[0].name()} and ${ordered[1].name()} for $${cost}`,
    );
  }

  validate(data: ConnectCitiesData): void {
    super.validate(data);
    const connection = this.getConnection(data);
    const grid = this.grid();
    const connections = grid.connections.map((c) =>
      c.id === connection.id
        ? { ...c, owner: { color: this.currentPlayer().color } }
        : c,
    );
    this.rules.validate(
      grid.merge(
        OrderedMap([...grid.entries()].map(([c, s]) => [c, s.data])),
        connections,
      ),
    );
  }
}

export class HoneybeeClaimAction extends ClaimAction {
  private readonly rules = inject(HoneybeeLinkRules);
  validate(data: ClaimData): void {
    super.validate(data);
    const space = this.grid().get(data.coordinates) as Land;
    const track = space.getTrack().find((t) => t.isClaimable())!;
    this.rules.validate(
      withRouteOwner(this.grid(), track, this.currentPlayer().color),
    );
  }
}
