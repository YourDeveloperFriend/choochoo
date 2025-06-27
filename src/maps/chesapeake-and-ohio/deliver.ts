import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { City } from "../../engine/map/city";
import { MoveHelper } from "../../engine/move/helper";
import { LocoAction } from "../../engine/move/loco";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MovePhase } from "../../engine/move/phase";
import { SpaceType } from "../../engine/state/location_type";
import { PlayerColorZod, PlayerData } from "../../engine/state/player";
import { CoordinatesZod } from "../../utils/coordinates";
import { peek } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { ChesapeakeAndOhioMapData } from "./build";
import { Random } from "../../engine/game/random";
import { Good, goodToString } from "../../engine/state/good";
import { PlayerHelper } from "../../engine/game/player";
import { MoveValidator } from "../../engine/move/validator";

const UsedLink = z.object({
  start: CoordinatesZod,
  end: CoordinatesZod,
  owner: PlayerColorZod.optional(),
});
type UsedLink = z.infer<typeof UsedLink>;

const ChesapeakeAndOhioMoveState = z.object({
  movesRemaining: z.number(),
  lastStop: CoordinatesZod.optional(),
  usedLinks: UsedLink.array(),
});
type ChesapeakeAndOhioMoveState = z.infer<typeof ChesapeakeAndOhioMoveState>;

const CHESAPEAKE_AND_OHIO_MOVE_STATE = new Key("chesapeakeAndOhioMoveState", {
  parse: ChesapeakeAndOhioMoveState.parse,
});

export class ChesapeakeAndOhioMovePhase extends MovePhase {
  private readonly moveHelper = inject(MoveHelper);
  private readonly chesapeakeAndOhioMoveState = injectState(
    CHESAPEAKE_AND_OHIO_MOVE_STATE,
  );
  protected readonly currentPlayer = injectCurrentPlayer();

  onStartTurn() {
    const result = super.onStartTurn();
    this.chesapeakeAndOhioMoveState.initState({
      movesRemaining: this.moveHelper.getLocomotive(this.currentPlayer()),
      usedLinks: [],
    });
    return result;
  }

  onEndTurn(): void {
    this.chesapeakeAndOhioMoveState.delete();
    return super.onEndTurn();
  }
}

export class ChesapeakeAndOhioMoveHelper extends MoveHelper {
  private readonly chesapeakeAndOhioMoveState = injectState(
    CHESAPEAKE_AND_OHIO_MOVE_STATE,
  );

  isWithinLocomotive(_: PlayerData, moveData: MoveData): boolean {
    return (
      moveData.path.length <= this.chesapeakeAndOhioMoveState().movesRemaining
    );
  }
}

export class ChesapeakeAndOhioMoveAction extends MoveAction {
  private readonly chesapeakeAndOhioMoveState = injectState(
    CHESAPEAKE_AND_OHIO_MOVE_STATE,
  );
  private readonly random = inject(Random);
  private readonly playerHelper = inject(PlayerHelper);

  process(action: MoveData): boolean {
    super.process(action);
    const city = this.grid().get(
      action.path[action.path.length - 1].endingStop,
    );
    assert(city instanceof City);
    const mapData = city.getMapSpecific(ChesapeakeAndOhioMapData.parse);
    if (mapData && mapData.factoryColor !== undefined) {
      const player = this.playerHelper.getPlayer(mapData.factoryColor);
      if (!player.outOfGame) {
        this.log.player(
          player,
          "receives 1 extra income for a delivery to their factory",
        );
        this.playerHelper.update(player.color, (player) => {
          player.income += 1;
        });
      }

      let pull: Good[];
      this.bag.update((bag) => {
        pull = this.random.draw(2, bag, false);
      });

      this.gridHelper.update(city.coordinates, (loc) => {
        assert(loc.type === SpaceType.CITY);
        if (!loc.goods) {
          loc.goods = [];
        }
        for (const good of pull) {
          this.log.log(
            `A ${goodToString(good)} good was added to ${this.gridHelper.displayName(city.coordinates)} from the factory delivery.`,
          );
          loc.goods.push(good);
        }
      });
    }

    this.chesapeakeAndOhioMoveState.update((val) => {
      val.movesRemaining -= action.path.length;
      val.lastStop = peek(action.path).endingStop;
      let start = action.startingCity;
      for (const path of action.path) {
        val.usedLinks.push({
          start: start,
          end: path.endingStop,
          owner: path.owner,
        });
        start = path.endingStop;
      }
    });

    return this.chesapeakeAndOhioMoveState().movesRemaining === 0;
  }
}

export class ChesapeakeAndOhioMoveValidator extends MoveValidator {
  private readonly chesapeakeAndOhioMoveState = injectState(
    CHESAPEAKE_AND_OHIO_MOVE_STATE,
  );

  validate(player: PlayerData, action: MoveData) {
    super.validate(player, action);
    const { lastStop, usedLinks } = this.chesapeakeAndOhioMoveState();
    if (lastStop != null) {
      assert(lastStop === action.startingCity, {
        invalidInput: `must start chain move from ${this.grid().displayName(lastStop)}`,
      });
    }

    this.validateUsedLinksNotReused(player, action, usedLinks);
  }

  private validateUsedLinksNotReused(
    player: PlayerData,
    action: MoveData,
    usedLinks: UsedLink[],
  ) {
    let fromCity = action.startingCity;
    for (const step of action.path) {
      const routes = [
        ...this.findRoutesToLocation(player, fromCity, step.endingStop),
      ];

      const matchingRoutesCount = routes.filter(
        (r) => r.owner === step.owner,
      ).length;
      const usedRoutesCount = usedLinks.filter((link: UsedLink) => {
        return (
          link.owner === step.owner &&
          ((link.start.equals(fromCity) && link.end.equals(step.endingStop)) ||
            (link.end.equals(fromCity) && link.start.equals(step.endingStop)))
        );
      }).length;
      assert(matchingRoutesCount > usedRoutesCount, {
        invalidInput: `cannot re-use the route between ${this.grid().displayName(fromCity)} and ${this.grid().displayName(step.endingStop)} on this chain`,
      });
      fromCity = step.endingStop;
    }
  }
}

export class ChesapeakeAndOhioLocoAction extends LocoAction {
  private readonly chesapeakeAndOhioMoveState = injectState(
    CHESAPEAKE_AND_OHIO_MOVE_STATE,
  );

  validate(): void {
    super.validate();
    assert(this.chesapeakeAndOhioMoveState().lastStop == null, {
      invalidInput: "cannot loco in the middle of a delivery chain",
    });
  }
}
