import z from "zod";
import { BuildData } from "../engine/build/build";
import { ClaimData } from "../engine/build/claim";
import { ConnectCitiesData } from "../engine/build/connect_cities";
import { BuildDiscountManager } from "../engine/build/discount";
import { SimpleConstructor } from "../engine/framework/dependency_stack";
import { injectState } from "../engine/framework/execution_context";
import { Key } from "../engine/framework/key";
import { injectCurrentPlayer } from "../engine/game/state";
import { Module } from "../engine/module/module";
import { Action } from "../engine/state/action";

const ENGINEER = new Key("engineer", {
  parse: z.object({
    previousBuildCost: z.number(),
  }).parse,
});

export class EngineerFreeBuildModule extends Module {
  installMixins() {
    this.installMixin(BuildDiscountManager, freeBuildMixin);
  }
}

function freeBuildMixin(
  Ctor: SimpleConstructor<BuildDiscountManager>,
): SimpleConstructor<BuildDiscountManager> {
  return class extends Ctor {
    private readonly currentPlayer = injectCurrentPlayer();
    private readonly engineer = injectState(ENGINEER);

    getMinimumBuild(): number {
      if (this.engineer.isInitialized()) {
        return 2;
      }
      return this.currentPlayer().selectedAction === Action.ENGINEER ? 0 : 2;
    }

    getDiscount(
      _: BuildData | ClaimData | ConnectCitiesData,
      previousCost: number,
    ): number {
      if (this.currentPlayer().selectedAction === Action.ENGINEER) {
        return Math.max(
          0,
          previousCost -
            this.engineer.getOr({ previousBuildCost: 0 }).previousBuildCost,
        );
      }
      return 0;
    }

    applyDiscount(
      _: BuildData | ClaimData | ConnectCitiesData,
      previousCost: number,
    ): void {
      if (this.currentPlayer().selectedAction === Action.ENGINEER) {
        this.engineer.upsert({
          previousBuildCost: Math.max(
            this.engineer.getOr({ previousBuildCost: 0 }).previousBuildCost,
            previousCost,
          ),
        });
      }
    }

    onBuildRoundEnd(): void {
      if (this.engineer.isInitialized()) {
        this.engineer.delete();
      }
    }
  };
}
