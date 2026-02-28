import { Good } from "../../engine/state/good";
import { goodStyle } from "./good";

const cache = new Map<Good, string>();
const fallback = "#444444";

export function readGoodColor(g: Good): string {
  if (cache.has(g)) return cache.get(g)!;
  if (typeof document === "undefined") return fallback;
  try {
    const el = document.createElement("div");
    el.className = goodStyle(g);
    el.style.position = "absolute";
    el.style.visibility = "hidden";
    el.style.pointerEvents = "none";
    document.body.appendChild(el);
    const value = getComputedStyle(el).getPropertyValue("--good-color");
    document.body.removeChild(el);
    const v = value ? value.trim() : "";
    const res = v || fallback;
    cache.set(g, res);
    return res;
  } catch (e) {
    return fallback;
  }
}
