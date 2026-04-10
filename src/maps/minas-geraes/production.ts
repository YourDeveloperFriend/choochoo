import { EmptyActionProcessor } from "../../engine/game/action";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { inject, injectState } from "../../engine/framework/execution_context";
import { GOODS_GROWTH_STATE } from "../../engine/goods_growth/state";
import { Good, goodToString } from "../../engine/state/good";
import { BAG, injectGrid } from "../../engine/game/state";
import { Random } from "../../engine/game/random";
import {
  ProductionAction,
  ProductionData,
} from "../../engine/goods_growth/production";
import { assert } from "../../utils/validate";
import { MiningToMoneyAction } from "./mining";
import { MinasGeraesMapData } from "./grid";
import { Log } from "../../engine/game/log";

export class MinasGeraesGoodsGrowthPhase extends GoodsGrowthPhase {
  private readonly grid = injectGrid();

  configureActions() {
    super.configureActions();
    this.installAction(RedrawProductionAction);
    this.installAction(MiningToMoneyAction);
  }

  onStart() {
    super.onStart();

    const ouroPreto = this.grid()
      .cities()
      .find(
        (city) =>
          city.getMapSpecific(MinasGeraesMapData.parse)?.ouroPretoCubeSource,
      );
    assert(ouroPreto !== undefined);

    if (ouroPreto.getGoods().length > 0) {
      // If there is a yellow cube, just remove it
      if (ouroPreto.getGoods().some((g) => g === Good.YELLOW)) {
        this.log.log("A gold is removed from Ouro Preto");
        this.gridHelper.update(ouroPreto.coordinates, (space) => {
          assert(space.goods !== undefined);
          const yellowIdx = space.goods.indexOf(Good.YELLOW);
          assert(yellowIdx !== -1);
          space.goods.splice(yellowIdx, 1);
          this.bag.update((bag) => bag.push(Good.YELLOW));
        });
      } else {
        // Otherwise determine the most rare cube on the board
        const goodsCount = new Map<Good, number>();
        for (const space of this.grid().values()) {
          for (const good of space.getGoods()) {
            goodsCount.set(good, (goodsCount.get(good) || 0) + 1);
          }
        }

        // Find the good(s) with the lowest count on the board
        let minCount = Infinity;
        for (const good of ouroPreto.getGoods()) {
          const count = goodsCount.get(good) ?? 0;
          if (count < minCount) {
            minCount = count;
          }
        }
        const candidates = ouroPreto
          .getGoods()
          .filter((g) => (goodsCount.get(g) ?? 0) === minCount);
        const toRemove = candidates[this.random.random(candidates.length)];
        this.log.log(
          `A ${goodToString(toRemove)} cube is removed from Ouro Preto`,
        );
        // Then return this cube from Ouro Preto to the bag
        this.gridHelper.update(ouroPreto.coordinates, (space) => {
          assert(space.goods !== undefined);
          const idx = space.goods.indexOf(toRemove);
          assert(idx !== -1);
          space.goods.splice(idx, 1);
          this.bag.update((bag) => bag.push(toRemove));
        });
      }
    }

    // Now check if ouroPreto is empty and if so, refresh its cube and increase its cost
    let increaseOpCost = false;
    this.gridHelper.update(ouroPreto.coordinates, (space) => {
      if (space.goods === undefined || space.goods.length === 0) {
        const bag = [...this.bag()];
        space.goods = this.random.draw(this.playerCount(), bag, false);
        this.log.log(
          "New cubes are drawn for Oero Preto: " +
            space.goods.map((g) => goodToString(g)).join(", "),
        );
        this.bag.set(bag);
        increaseOpCost = true;
      }
    });
    if (increaseOpCost) {
      this.log.log("The cost to deliver via Ouro Preto is increased.");
      for (const city of this.gridHelper.findAllCities()) {
        const mapSpecific = city.getMapSpecific(MinasGeraesMapData.parse);
        if (mapSpecific && mapSpecific.ouroPretoCost !== undefined) {
          this.gridHelper.update(city.coordinates, (space) => {
            space.mapSpecific.ouroPretoCost += 1;
          });
        }
      }
    }
  }
}

export class MinasGeraesProductionAction extends ProductionAction {
  validate(data: ProductionData) {
    super.validate(data);
    if (data.good === Good.YELLOW) {
      const city = this.findCity(data);
      assert(city != null, { invalidInput: "must place good on a city" });
      assert(city.goodColors().indexOf(Good.BLACK) !== -1, {
        invalidInput:
          "Gold can only be placed on the goods growth of black cities.",
      });
    }
  }
}

export class RedrawProductionAction extends EmptyActionProcessor {
  static readonly action = "redraw-production-gold";
  private readonly goodsGrowthState = injectState(GOODS_GROWTH_STATE);
  private readonly bag = injectState(BAG);
  private readonly random = inject(Random);
  private readonly log = inject(Log);

  canEmit() {
    const goods = this.goodsGrowthState();
    return (
      goods.goods.some((g) => g === Good.YELLOW) &&
      this.bag().some((g) => g !== Good.YELLOW)
    );
  }

  validate() {
    super.validate();
  }

  process(): boolean {
    const bag = [...this.bag()];
    let draw = this.goodsGrowthState().goods;

    // Find out how many we need to replace
    let numToReplace = 0;
    for (const good of draw) {
      if (good === Good.YELLOW) {
        numToReplace += 1;
      }
    }

    // Move drawn yellow cubes back to the bag
    draw = draw.filter((g) => g !== Good.YELLOW);
    for (let i = 0; i < numToReplace; i++) {
      bag.push(Good.YELLOW);
    }
    this.random.shuffle(bag);

    // Go through cubes until we have found the right number of non-yellow cubes
    let foundReplacements = 0;
    for (let i = 0; i < bag.length; i++) {
      if (bag[i] !== Good.YELLOW) {
        draw.push(bag[i]);
        this.log.currentPlayer(
          "draws a " +
            goodToString(bag[i]) +
            " replacement for gold for production",
        );
        bag.splice(i, 1);
        i -= 1;
        foundReplacements += 1;
        if (foundReplacements >= numToReplace) {
          break;
        }
      }
    }

    // Update the state and return
    this.bag.set(bag);
    this.goodsGrowthState.set({
      goods: draw,
    });

    return false;
  }
}
