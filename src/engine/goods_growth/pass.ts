import { z } from "zod";
import { inject } from "../framework/execution_context";
import { ActionProcessor, EmptyAction } from "../game/action";
import { Log } from "../game/log";

export class PassAction implements ActionProcessor<EmptyAction> {
  static readonly action = "pass";
  readonly assertInput = z.object({}).parse;
  private readonly log = inject(Log);

  validate() {}

  process(): boolean {
    this.log.currentPlayer("skips production action");
    return true;
  }
}
