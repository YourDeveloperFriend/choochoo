
import { assert, assertNever } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { injectCurrentPlayer } from "../game/state";
import { GridHelper } from "../map/grid_helper";
import { Land } from "../map/location";
import { isTownTile } from "../map/tile";
import { Action } from "../state/action";
import { ComplexTileType, SimpleTileType, TileType, TownTileType } from "../state/tile";
import { BUILD_STATE } from "./state";


export class BuilderHelper {
  protected readonly currentPlayer = injectCurrentPlayer();
  protected readonly buildState = injectState(BUILD_STATE);
  protected readonly grid = inject(GridHelper);

  isAtEndOfTurn(): boolean {
    return this.buildsRemaining() === 0 && !this.canUrbanize();
  }

  canUrbanize(): boolean {
    return this.currentPlayer().selectedAction === Action.URBANIZATION &&
      !this.buildState().hasUrbanized;
  }

  getMaxBuilds(): number {
    return this.currentPlayer().selectedAction === Action.ENGINEER ? 4 : 3;
  }

  buildCount(): number {
    // TODO: remove the call to previousBuilds and just rely on buildCount, once all games have migrated.
    return this.buildState().buildCount ?? this.buildState().previousBuilds.length;
  }

  buildsRemaining(): number {
    return this.getMaxBuilds() - this.buildCount();
  }

  tileAvailableInManifest(newTile: TileType): boolean {
    const manifest = this.calculateManifest(newTile);
    const invariantType = [...manifest.entries()].find(([key, value]) => value < 0)?.[0];
    return invariantType == null;
  }

  trackManifest(): Map<TileType, number> {
    const manifest = this.calculateManifest();
    const invariantType = [...manifest.entries()].find(([key, value]) => value < 0)?.[0];
    assert(invariantType == null, 'Oops, we have used too much of tile ' + invariantType);
    return manifest;
  }

  shouldAutoPass(): boolean {
    if (this.canUrbanize()) return false;
    return this.currentPlayer().money < this.minimumBuildCost();
  }

  protected minimumBuildCost(): number {
    // The base game, you need at least $2 for any build.
    return 2;
  }

  private calculateManifest(newTile?: TileType): Map<TileType, number> {
    const manifest = new Map<TileType, number>([
      [SimpleTileType.STRAIGHT, 48],
      [SimpleTileType.CURVE, 55],
      [SimpleTileType.TIGHT, 7],
      [TownTileType.LOLLYPOP, 3],
      [TownTileType.TIGHT_THREE, 2],
      [TownTileType.LEFT_LEANER, 2],
      [TownTileType.RIGHT_LEANER, 2],
      [TownTileType.THREE_WAY, 2],
      [ComplexTileType.X, 4],
      [ComplexTileType.BOW_AND_ARROW, 4],
      [ComplexTileType.CROSSING_CURVES, 3],
      [ComplexTileType.STRAIGHT_TIGHT, 1],
      [ComplexTileType.COEXISTING_CURVES, 1],
      [ComplexTileType.CURVE_TIGHT_1, 1],
      [ComplexTileType.CURVE_TIGHT_2, 1],
    ]);

    const townTiles = new Map<TownTileType, number>();

    const tiles = [...this.grid.all()].filter((space): space is Land =>
      space instanceof Land).filter(space => space.hasTile())
      .map((space) => space.getTileType()!);
    // We have to verify the new tile before shifting through all the
    // complexities around town tiles.
    if (newTile != null) {
      tiles.push(newTile);
    }

    for (const tile of tiles) {
      if (isTownTile(tile)) {
        townTiles.set(tile, (townTiles.get(tile) ?? 0) + 1);
        continue;
      }
      manifest.set(tile, manifest.get(tile)! - 1);
    }

    for (const [tile, count] of townTiles) {
      const options = this.getTileOptions(tile);
      // If we can't find an available one, then oh well, just pick one and we'll mark it as negative.
      const newType = options.find((type) => manifest.get(type)! > 0) ?? options[0];
      manifest.set(newType, manifest.get(newType)! - count);
    }
    return manifest;
  }

  private getTileOptions(tile: TownTileType): TileType[] {
    switch (tile) {
      case TownTileType.LOLLYPOP:
      case TownTileType.THREE_WAY:
      case TownTileType.TIGHT_THREE:
      case TownTileType.LEFT_LEANER:
      case TownTileType.RIGHT_LEANER:
        return [tile];
      case TownTileType.STRAIGHT:
        return [SimpleTileType.STRAIGHT];
      case TownTileType.CURVE:
        return [SimpleTileType.CURVE]
      case TownTileType.TIGHT:
        return [SimpleTileType.TIGHT];
      case TownTileType.CHICKEN_FOOT:
        return [
          ComplexTileType.BOW_AND_ARROW,
          ComplexTileType.CURVE_TIGHT_1,
          ComplexTileType.CURVE_TIGHT_2,
        ];
      case TownTileType.K:
        return [
          ComplexTileType.CROSSING_CURVES,
          ComplexTileType.STRAIGHT_TIGHT,
        ];
      case TownTileType.X:
        return [
          ComplexTileType.X,
          ComplexTileType.COEXISTING_CURVES,
        ];

      default:
        assertNever(tile);
    }
  }
}