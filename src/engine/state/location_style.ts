import z from "zod";

// Land spaces may carry any string style key, declared and resolved by the
// owning map's MapViewSettings.getLandStyles() — there is no shared enum, so
// a map is free to add new styles without touching shared code.
export const SpaceStyleZod = z.string();
