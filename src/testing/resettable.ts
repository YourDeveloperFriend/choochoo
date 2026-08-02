import { afterEach, beforeEach } from "vitest";

import { assert } from "../utils/validate";

export function resettable<T>(getter: () => T): () => T {
  let instance: T | undefined;
  beforeEach(() => {
    instance = getter();
  });

  afterEach(() => {
    instance = undefined;
  });

  return () => {
    assert(
      instance != null,
      "cannot call resettable getter outside of a beforeEach or a test",
    );
    return instance;
  };
}
