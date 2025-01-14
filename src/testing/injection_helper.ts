import 'jasmine';
import { SimpleConstructor } from "../engine/framework/dependency_stack";
import { setInjectionContext } from "../engine/framework/execution_context";
import { InjectionContext } from "../engine/framework/inject";
import { Key } from '../engine/framework/key';
import { StateStore } from '../engine/framework/state';
import { ReversteamMapSettings } from '../maps/reversteam/settings';
import { resettable } from './resettable';

export class InjectionHelper {
  private readonly injector = resettable(() => new InjectionContext(new ReversteamMapSettings().key));

  private constructor() { }

  static install(): InjectionHelper {
    const helper = new InjectionHelper();

    beforeEach(() => {
      setInjectionContext(helper.injector());
    });

    afterEach(() => {
      setInjectionContext();
    });

    return helper;
  }

  resettableSpyOn<T, K extends keyof T = keyof T>(ctor: SimpleConstructor<T>, key: T[K] extends Function ? K : never, handleSpy?: (spy: ReturnType<typeof spyOn<T, K>>) => void): () => ReturnType<typeof spyOn<T, K>> {
    const spy = resettable(() => this.spyOn(ctor, key));
    beforeEach(() => {
      handleSpy && handleSpy(spy());
    });
    return spy;
  }

  spyOn<T, K extends keyof T = keyof T>(ctor: SimpleConstructor<T>, key: T[K] extends Function ? K : never): ReturnType<typeof spyOn<T, K>> {
    return spyOn(this.injector().get(ctor), key);
  }

  initResettableState<T>(key: Key<T>, value: T): void {
    beforeEach(() => {
      this.state().init(key, value);
    });
  }

  state(): StateStore {
    return this.injector().get(StateStore);
  }
}

