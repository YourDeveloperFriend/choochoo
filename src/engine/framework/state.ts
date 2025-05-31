import z from "zod";
import { deepCopy } from "../../utils/deep_copy";
import { freeze, Immutable } from "../../utils/immutable";
import { Tuple } from "../../utils/types";
import { assert } from "../../utils/validate";
import { Memory } from "../game/memory";
import { DependencyStack } from "./dependency_stack";
import { inject } from "./execution_context";
import { Key } from "./key";

interface StateContainer<T> {
  state?: { value: Immutable<T> };
  listeners: Set<() => void>;
}

const SerializedGameDataV3 = z.object({
  version: z.literal(3),
  gameData: z.record(z.string(), z.unknown()),
});
type SerializedGameDataV3 = z.infer<typeof SerializedGameDataV3>;

export const SerializedGameData = SerializedGameDataV3;
export type SerializedGameData = z.infer<typeof SerializedGameData>;

type TypedEntry<T> = [Key<T>, StateContainer<T>];

interface TypedMap {
  entries(): Iterable<TypedEntry<unknown>>;
  has<T>(key: Key<T>): boolean;
  delete<T>(key: Key<T>): void;
  get<T>(key: Key<T>): StateContainer<T>;
  set<T>(key: Key<T>, value: StateContainer<T>): void;
}

export class StateStore {
  private readonly dependencyStack = inject(DependencyStack);
  private state: TypedMap = inject(Memory).rememberMap() as TypedMap;

  reset(): void {
    this.state = new Map();
  }

  init<T>(key: Key<T>, state: T): void {
    assert(!this.isInitialized(key), "cannot call init on initialized key");
    this.initContainerIfNotExists(key);
    this.internalSet(key, state);
  }

  private initContainerIfNotExists<T>(key: Key<T>): void {
    if (this.state.has(key)) return;
    const container: StateContainer<T> = {
      state: undefined,
      listeners: new Set(),
    };
    this.state.set(key, container);
  }

  set<T>(key: Key<T>, state: T): void {
    assert(this.isInitialized(key), "cannot call set with uninitialized key");
    this.internalSet(key, state);
  }

  private internalSet<T>(key: Key<T>, state: T): void {
    const container = this.getContainer(key);
    container.state = { value: freeze(state) };
    this.notifyListeners(key);
  }

  private notifyListeners<T>(key: Key<T>) {
    const container = this.getContainer(key);
    for (const listener of container.listeners) {
      listener();
    }
  }

  isInitialized<T>(key: Key<T>): boolean {
    return this.state.has(key) && this.getContainer(key).state != null;
  }

  get<T>(key: Key<T>): Immutable<T> {
    assert(
      this.isInitialized(key),
      `cannot call get on uninitialized key: ${key.name}`,
    );
    return this.getContainer(key).state!.value;
  }

  private getContainer<T>(key: Key<T>): StateContainer<T> {
    if (!this.state.has(key)) {
      throw new Error(`state ${key.name} not found`);
    }
    return this.state.get(key);
  }

  listenAll(keys: Set<Key<unknown>>, listenerFn: () => void): () => void {
    const cbs: Array<() => void> = [];
    for (const key of keys) {
      cbs.push(this.listen(key, () => listenerFn()));
    }
    return () => {
      for (const cb of cbs) {
        cb();
      }
    };
  }

  listen<T>(key: Key<T>, listenerFn: () => void): () => void {
    this.initContainerIfNotExists(key);
    const container = this.getContainer(key);
    container.listeners.add(listenerFn);
    return () => {
      container.listeners.delete(listenerFn);
      this.maybeDeleteKey(key);
    };
  }

  update<T>(key: Key<T>, updateFn: (t: T) => void): void {
    const newValue = deepCopy(this.get(key));
    updateFn(newValue);
    this.set(key, newValue);
  }

  delete<T>(key: Key<T>): void {
    assert(this.isInitialized(key), "cannot call delete on uninitialized key");
    this.getContainer(key).state = undefined;
    this.notifyListeners(key);
    this.maybeDeleteKey(key);
  }

  private maybeDeleteKey<T>(key: Key<T>): void {
    const container = this.state.get(key);
    if (container == null) return;
    if (container.state == null && container.listeners.size == 0) {
      this.state.delete(key);
    }
  }

  injectState<T>(key: Key<T>): InjectedState<T> {
    this.dependencyStack.addDependency(key);
    const result = () => this.get(key);
    const ops: InjectedOps<T> = {
      initState: (state: T) => this.init(key, state),
      set: (state: T) => this.set(key, state),
      isInitialized: () => this.isInitialized(key),
      listen: (listenFn: () => void): (() => void) =>
        this.listen(key, listenFn),
      update: (updateFn: (t: T) => void) => this.update(key, updateFn),
      delete: () => this.delete(key),
    };
    return Object.assign(result, ops);
  }

  serialize(): string {
    // TODO: Come up with a clever way to deserialize.
    // For now, use json.
    const gameData = Object.fromEntries(
      [...this.state.entries()]
        .filter(([_, value]) => value.state != null)
        .map(([key, value]) => [key.name, key.serialize(value.state!.value)]),
    );
    const data: SerializedGameData = {
      version: 3,
      gameData,
    };
    return JSON.stringify(data);
  }

  merge(gameDataStr: string): void {
    const { gameData } = SerializedGameData.parse(JSON.parse(gameDataStr));
    const updates: ValueChange[] = Object.entries(gameData)
      .filter(([key]) => !Key.isDeprecated(key))
      .filter(([key, value]) => this.mergeValue(Key.fromString(key), value))
      .map(([key]) => ({ key }));

    const keepKeys = new Set(Object.keys(gameData));
    const allKeys = [...this.state.entries()].map(([key]) => key);

    const deletes: ValueChange[] = [];
    for (const key of allKeys) {
      this.initContainerIfNotExists(key);
      if (keepKeys.has(key.name) || !this.isInitialized(key)) {
        continue;
      }
      this.delete(key);
      deletes.push({ key: key.name });
    }

    const changes = updates.concat(deletes);

    for (const change of changes) {
      this.notifyListeners(Key.fromString(change.key));
    }
  }

  private mergeValue<T>(key: Key<T>, unparsedValue: unknown): boolean {
    this.initContainerIfNotExists(key);
    const container = this.getContainer<T>(key);
    const newValue = freeze(key.parse(unparsedValue));
    if (container.state == null) {
      container.state = { value: newValue };
      return true;
    } else {
      const oldValue = container.state.value;
      const mergedValue = key.merge(oldValue, newValue);
      container.state = { value: mergedValue };
      return mergedValue !== oldValue;
    }
  }
}

interface ValueChange {
  key: string;
}

export type KeyArray<T extends Tuple> = {
  [Index in keyof T]: Key<T[Index]>;
} & { length: T["length"] };

interface InjectedOps<Data> {
  initState(state: Data): void;
  isInitialized(): boolean;
  set(state: Data): void;
  update(updateFn: (state: Data) => void): void;
  listen(listenFn: () => void): () => void;
  delete(): void;
}

export type InjectedState<Data> = (() => Immutable<Data>) & InjectedOps<Data>;
