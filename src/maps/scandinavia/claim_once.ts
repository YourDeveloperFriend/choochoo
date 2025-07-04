import z from "zod";
import { ClaimAction, ClaimData } from "../../engine/build/claim";
import { BuildPhase } from "../../engine/build/phase";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { assert } from "../../utils/validate";

const HAS_CLAIMED = new Key("hasClaimed", { parse: z.boolean().parse });

export class ScandinaviaBuildPhase extends BuildPhase {
  private readonly hasClaimed = injectState(HAS_CLAIMED);

  onStartTurn(): void {
    this.hasClaimed.initState(false);
    return super.onStartTurn();
  }

  onEndTurn(): void {
    this.hasClaimed.delete();
    return super.onEndTurn();
  }
}

export class ScandinaviaClaimAction extends ClaimAction {
  private readonly hasClaimed = injectState(HAS_CLAIMED);

  validate(data: ClaimData): void {
    assert(!this.hasClaimed(), {
      invalidInput: "Can only claim one sea route per turn",
    });
    return super.validate(data);
  }

  process(data: ClaimData): boolean {
    this.hasClaimed.set(true);
    return super.process(data);
  }
}
