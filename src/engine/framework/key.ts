import z from "zod";
import { deepEquals } from "../../utils/deep_equals";
import { Immutable } from "../../utils/immutable";
import { SomePartial } from "../../utils/types";
import { assert } from "../../utils/validate";

type ParseFunction<T> = (value: unknown) => T;

type SerializeFunction<T> = (value: T) => unknown;

type MergeFunction<T> = (
  oldValue: Immutable<T>,
  newValue: Immutable<T>,
) => Immutable<T>;

function defaultSerialize<T>(value: T): unknown {
  return value;
}

function defaultMerge<T>(
  oldValue: Immutable<T>,
  newValue: Immutable<T>,
): Immutable<T> {
  if (deepEquals(oldValue, newValue)) {
    return oldValue;
  }
  return newValue;
}

interface KeyParams<T> {
  parse: ParseFunction<T>;
  serialize: SerializeFunction<T>;
  merge: MergeFunction<T>;
}

export class Key<T> {
  private static readonly deprecatedKeys = new Set(["gameStatus"]);
  private static readonly registry = new Map<string, Key<unknown>>();

  readonly parse: ParseFunction<T>;
  readonly serialize: SerializeFunction<T>;
  readonly merge: MergeFunction<T>;

  constructor(
    readonly name: string,
    params: SomePartial<KeyParams<T>, "serialize" | "merge">,
  ) {
    this.parse = params.parse;
    this.serialize = params?.serialize ?? defaultSerialize;
    this.merge = params?.merge ?? defaultMerge;
    assert(!Key.registry.has(this.name), `duplicate key name ${this.name}`);
    Key.registry.set(this.name, this as Key<unknown>);
  }

  static isDeprecated(name: string): boolean {
    return this.deprecatedKeys.has(name);
  }

  static fromString<T>(name: string): Key<T> {
    const result = this.registry.get(name);
    assert(
      result != null,
      `key ${name} not found, should it have been deprecated?`,
    );
    return result as Key<T>;
  }
}

const UnknownArray = z.array(z.unknown());

export class SetKey<T> extends Key<Set<T>> {
  constructor(
    name: string,
    params: SomePartial<Omit<KeyParams<T>, "merge">, "serialize">,
  ) {
    super(name, {
      parse: (value) => new Set(UnknownArray.parse(value).map(params.parse)),
      serialize: (value) =>
        [...value].map(params.serialize ?? defaultSerialize),
      merge: (_, value) => value,
    });
  }
}

const EntryArray = z.array(z.tuple([z.unknown(), z.unknown()]));

export class MapKey<R, S> extends Key<Map<R, S>> {
  constructor(
    name: string,
    keyParse: ParseFunction<R>,
    valueParse: ParseFunction<S>,
  ) {
    super(name, {
      parse: (value) =>
        new Map(
          EntryArray.parse(value).map(([key, value]) => [
            keyParse(key),
            valueParse(value),
          ]),
        ),
      serialize: (value: Map<R, S>) => [...value.entries()],
      merge: (oldValue, newValue) => {
        let mergedValue = oldValue;
        for (const [key, value] of newValue) {
          if (deepEquals(mergedValue.get(key), value)) {
            continue;
          }
          mergedValue = mergedValue.set(key, value);
        }
        for (const key of mergedValue.keys()) {
          if (newValue.has(key)) {
            continue;
          }
          mergedValue = mergedValue.delete(key);
        }
        return mergedValue;
      },
    });
  }
}
