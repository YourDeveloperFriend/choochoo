import { MapRegistry } from "../../maps/registry";
import { assert } from "../../utils/validate";
import { Dependency, DependencyStack, SimpleConstructor } from "./dependency_stack";
import { Key } from "./key";

export class InjectionContext {
  private readonly overrides = new Map<SimpleConstructor<unknown>, unknown>();
  private readonly inConstruction = new Map<SimpleConstructor<unknown>, ProxyObject<unknown>>();
  private readonly dependencies = new Map<SimpleConstructor<unknown>, Set<Dependency>>();
  private readonly injected = new Map<SimpleConstructor<unknown>, unknown>();
  private readonly dependencyStack = new DependencyStack();

  constructor(mapKey: string) {
    for (const override of MapRegistry.singleton.get(mapKey).getOverrides()) {
      const original = Object.getPrototypeOf(override);
      this.overrides.set(original, override);
    }

    // Carve out a special path for DependencyStack
    this.dependencies.set(DependencyStack, new Set<Dependency>());
    this.injected.set(DependencyStack, this.dependencyStack);
  }

  runFunction<T>(fn: () => T): [T, Set<Dependency>] {
    return this.dependencyStack.startDependencyStack(fn);
  }

  get<R>(factory: SimpleConstructor<R>): R {
    const overridden = this.overrides.get(factory) as SimpleConstructor<R> ?? factory;
    this.dependencyStack.addDependency(overridden);
    if (!this.injected.has(overridden)) {
      if (this.inConstruction.has(overridden)) {
        return this.inConstruction.get(overridden)!.proxy as R;
      }
      const proxyObject = buildProxy(overridden);
      this.inConstruction.set(overridden, proxyObject);
      const [result, dependencies] = this.runFunction(() => {
        return new overridden();
      });
      proxyObject.setInternalObject(result as R);
      this.inConstruction.delete(overridden);
      this.dependencies.set(overridden, dependencies);

      this.injected.set(overridden, result);
    }
    return this.injected.get(overridden) as R;
  }

  getStateDependencies(...dependencies: Array<Key<unknown> | SimpleConstructor<unknown>>): Set<Key<unknown>> {
    const stateDependencies = new Set<Key<unknown>>();
    const visited = new Set<SimpleConstructor<unknown>>();
    for (let index = 0; index < dependencies.length; index++) {
      const dependency = dependencies[index];
      if (dependency instanceof Key) {
        stateDependencies.add(dependency);
        continue;
      }
      if (visited.has(dependency)) continue;
      visited.add(dependency);
      assert(this.dependencies.has(dependency));
      dependencies.push(...this.dependencies.get(dependency)!);
    }
    return stateDependencies;
  }
}

interface Initialized<T> {
  value: T;
}

interface ProxyObject<T> {
  setInternalObject(t: T): void;
  proxy: T;
}

function buildProxy<R>(constructorFn: SimpleConstructor<R>): ProxyObject<R> {
  //we don't care about the target, but compiler does not allow a null one, so let's pass an "empty object" {}
  let initialized: Initialized<R> | undefined;
  const proxy = new Proxy({}, {
    get: function (_, property: string, __) {
      assert(initialized != null, 'called an uninitialized value');

      let item = (initialized.value as any)[property];
      if (typeof (item) === "function") {
        return function (...args: any) {
          assert(initialized != null, 'called an uninitialized value');
          return item.call(initialized.value, ...args);
        };
      } else {
        return item;
      }
    },

    set: function (_, property: string | symbol, value: any, __): boolean {
      assert(initialized != null, 'called an uninitialized value');
      (initialized.value as any)[property] = value;
      return true;
    },

  });

  return {
    proxy: proxy as R,
    setInternalObject: (value: R) => initialized = { value },
  };
}