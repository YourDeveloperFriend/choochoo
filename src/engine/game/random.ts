import seedrandom, { PRNG } from 'seedrandom';
import { iterate } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { inject } from "../framework/execution_context";
import { OnRoll } from "../state/roll";
import { Memory } from "./memory";

export class Random {
  private readonly memory = inject(Memory);
  private readonly reversible = this.memory.remember(true);
  private readonly seed = this.memory.remember<undefined | { seed: string, random: PRNG }>(undefined);

  shuffle<T>(array: T[]): T[] {
    const results: T[] = [];
    const values = [...array];
    while (values.length > 0) {
      const index = this.random(values.length);
      const value = [...values][index];
      results.push(value);
      values.splice(index, 1);
    }
    return results;
  }

  rollDie(): OnRoll {
    return OnRoll.parse(this.random(6) + 1);
  }

  rollDice(numDice: number): OnRoll[] {
    return iterate(numDice, () => this.rollDie());
  }

  draw<T>(number: number, arr: T[], failOnOverflow: boolean): T[] {
    assert(!failOnOverflow || number <= arr.length, 'cannot pull too many items from array');
    return iterate(Math.min(number, arr.length), () => {
      const index = this.random(arr.length);
      return arr.splice(index, 1)[0];
    });
  }

  random(number: number): number {
    this.reversible.set(false);
    return Math.floor(this.getRandomGen() * number);
  }

  private getRandomGen(): number {
    const seed = this.seed();
    if (seed == null) {
      this.setSeed(`${seedrandom()()}`.substring(2));
    }
    return this.seed()!.random();
  }

  getSeed(): string | undefined {
    return this.seed()?.seed;
  }

  setSeed(seed: string | undefined) {
    if (seed == null) return;
    this.seed.set({ seed, random: seedrandom(seed) });
  }

  isReversible(): boolean {
    return this.seed() != null;
  }
}