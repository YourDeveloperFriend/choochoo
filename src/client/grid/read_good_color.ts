import { Good } from "../../engine/state/good";
import { goodStyle } from "./good";

const cache = new Map<Good, string>();
const fallback = "#444444";

// Persistent hidden element for reading good colors efficiently
let persistentEl: HTMLDivElement | null = null;

function getPersistentEl(): HTMLDivElement {
  if (!persistentEl) {
    persistentEl = document.createElement("div");
    persistentEl.style.position = "absolute";
    persistentEl.style.visibility = "hidden";
    persistentEl.style.pointerEvents = "none";
    persistentEl.style.height = "0";
    persistentEl.style.width = "0";
    persistentEl.style.overflow = "hidden";
    document.body.appendChild(persistentEl);
  }
  return persistentEl;
}

/**
 * Cleanup function to remove the persistent DOM element and clear cache.
 * Useful for testing or when completely unmounting the application.
 */
export function cleanupGoodColorReader(): void {
  if (persistentEl && persistentEl.parentNode) {
    persistentEl.parentNode.removeChild(persistentEl);
    persistentEl = null;
  }
  cache.clear();
}

export function readGoodColor(g: Good): string {
  if (cache.has(g)) return cache.get(g)!;
  if (typeof document === "undefined") return fallback;
  try {
    const el = getPersistentEl();
    el.className = goodStyle(g);
    const value = getComputedStyle(el).getPropertyValue("--good-color");
    const v = value ? value.trim() : "";
    const res = v || fallback;
    cache.set(g, res);
    return res;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(`Failed to read color for good ${g}:`, e);
    }
    return fallback;
  }
}
