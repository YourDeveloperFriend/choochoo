import _ from "lodash";
import { afterEach, beforeEach, MockInstance, vi } from "vitest";

import { SimpleConstructor } from "../engine/framework/dependency_stack";
import { setInjectionContext } from "../engine/framework/execution_context";
import { InjectionContext } from "../engine/framework/inject";
import { Key } from "../engine/framework/key";
import { InjectedState, StateStore } from "../engine/framework/state";
import {
  REVERSTEAM_GAME_KEY,
  ReversteamMapSettings,
} from "../maps/reversteam/settings";
import { GameMemory } from "../engine/game/game_memory";
import { resettable } from "./resettable";

/**
 * The spy type for method `K` of the injected instance of `T`. The signature is
 * rebuilt via `infer` so that the result is a concrete function type, which is
 * what `MockInstance` requires; `MockInstance<T[K]>` doesn't typecheck because
 * TypeScript can't prove an indexed access satisfies the constraint.
 */
type MethodSpy<T, K extends keyof T> = T[K] extends (
  ...args: infer A
) => infer R
  ? MockInstance<(...args: A) => R>
  : never;

/** A minimal stand-in for vitest's unexported `Procedure` type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMethod = (...args: any[]) => any;

export class InjectionHelper {
  private readonly injector = resettable(
    () => new InjectionContext(new ReversteamMapSettings().key),
  );

  private constructor() {}

  static install(): InjectionHelper {
    const helper = new InjectionHelper();

    beforeEach(() => {
      setInjectionContext(helper.injector());

      helper.spyOn(GameMemory, "getGame").mockReturnValue({
        id: 1,
        gameKey: REVERSTEAM_GAME_KEY,
        variant: { baseRules: true },
      });
    });

    afterEach(() => {
      setInjectionContext();
    });

    return helper;
  }

  resettableSpyOn<T, K extends keyof T = keyof T>(
    ctor: SimpleConstructor<T>,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    key: T[K] extends Function ? K : never,
    handleSpy?: (spy: MethodSpy<T, K>) => void,
  ): () => MethodSpy<T, K> {
    const spy = resettable(() => this.spyOn(ctor, key));
    beforeEach(() => {
      handleSpy?.(spy());
    });
    return spy;
  }

  spyOn<T, K extends keyof T = keyof T>(
    ctor: SimpleConstructor<T>,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    key: T[K] extends Function ? K : never,
  ): MethodSpy<T, K> {
    // vi.spyOn's overloads can't accept a generic `keyof T`, so narrow the
    // instance to a plain record of methods and cast the result back.
    const instance = this.injector().get(ctor) as unknown as Record<
      string,
      AnyMethod
    >;
    return vi.spyOn(instance, key as string) as unknown as MethodSpy<T, K>;
  }

  initResettableState<T>(key: Key<T>, value: T): InjectedState<T> {
    let passthrough: InjectedState<T> | undefined;
    const result = (() => passthrough!()) as InjectedState<T>;

    beforeEach(() => {
      this.state().init(key, value);
      passthrough = this.state().injectState(key);
      _.merge(result, passthrough);
    });
    afterEach(() => {
      passthrough = undefined;
    });

    return result;
  }

  state(): StateStore {
    return this.injector().get(StateStore);
  }
}
