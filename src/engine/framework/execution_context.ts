import { freeze, Immutable } from "../../utils/immutable";
import { Tuple } from "../../utils/types";
import { assert } from "../../utils/validate";

import { SimpleConstructor } from "./dependency_stack";
import { InjectionContext } from "./inject";
import { Key } from "./key";
import { InjectedState, KeyArray, StateStore } from "./state";

let injectionContext: InjectionContext | undefined;

export function setInjectionContext(ctx?: InjectionContext) {
  injectionContext = ctx;
}

export function getInjectionContext(): InjectionContext {
  assert(injectionContext != null);
  return injectionContext;
}

export function inject<R>(factory: SimpleConstructor<R>): R {
  return getInjectionContext().get(factory);
}

export function injectState<T>(key: Key<T>): InjectedState<T> {
  return inject(StateStore).injectState(key);
}

export function compose<T, R>(
  injectFn: () => T,
  runFn: (t: T, previous?: R) => R,
): () => () => R {
  return () => {
    const injected = injectFn();
    let previous: R | undefined;
    return () => {
      previous = runFn(injected, previous);
      return previous;
    };
  };
}

export function composeState<
  Args extends Tuple,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (old: ReturnType<T> | undefined, ...args: Args) => any,
>(
  keys: NoInfer<KeyArray<Args>>,
  transformer: T,
): () => () => Immutable<ReturnType<T>> {
  let memoized:
    | {
        value: Immutable<ReturnType<T>>;
        parameters: Args;
      }
    | undefined = undefined;
  return () => {
    const injectedState = keys.map(injectState);
    return () => {
      const parameters = injectedState.map((injected) => injected()) as Args;
      if (
        memoized == null ||
        memoized.parameters.some((p, index) => parameters[index] !== p)
      ) {
        memoized = {
          value: freeze(transformer(memoized?.value, ...parameters)),
          parameters,
        };
      }
      return memoized.value;
    };
  };
}

export type Rest<T extends Tuple> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends [any, ...infer B] ? [...B] : never;
