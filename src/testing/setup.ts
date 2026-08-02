// Loaded before every test module (see vitest.config.mts `setupFiles`).
//
// The engine and the map registry form an import cycle: an action module such as
// engine/build/build.ts reaches engine/game/state.ts, which imports
// maps/registry.ts, which constructs every map's settings, some of which subclass
// that same action module. Whichever side is imported first wins; if an action
// module is imported first it observes its own base class as undefined and fails
// with "Class extends value undefined is not a constructor or null".
//
// Production entry points happen to reach the registry early, so this stays
// latent there. Tests import action classes directly and would otherwise be
// sensitive to import order -- including the order an import sorter happens to
// produce. Forcing the registry to evaluate first makes that irrelevant.
//
// This is a workaround, not a fix. The cycle itself is worth breaking, most
// plausibly by having maps register their settings into an engine-owned holder
// rather than having the engine import the map registry.
import "../maps/registry";
