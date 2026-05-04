import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const MAPS_DIR = resolve(__dirname, "../maps");
const GENERATED_HEADER =
  "// This file is auto-generated. Run 'npm run generate' to update.\n";

export function generateRegistries(): void {
  const allDirs = readdirSync(MAPS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "template")
    .map((d) => d.name)
    .sort();

  const mapDirs = allDirs.filter((d) =>
    existsSync(join(MAPS_DIR, d, "settings.ts")),
  );
  const viewDirs = allDirs.filter(
    (d) =>
      existsSync(join(MAPS_DIR, d, "view_settings.ts")) ||
      existsSync(join(MAPS_DIR, d, "view_settings.tsx")),
  );

  generateMapRegistry(mapDirs);
  generateViewRegistry(viewDirs);
}

function extractClassName(filePath: string, suffix: string): string {
  const content = readFileSync(filePath, "utf8");
  const match = content.match(new RegExp(`export class (\\w+${suffix})`));
  if (!match)
    throw new Error(
      `No exported class ending in ${suffix} found in ${filePath}`,
    );
  return match[1];
}

function generateMapRegistry(dirs: string[]): void {
  const entries = dirs.map((d) => {
    const className = extractClassName(
      join(MAPS_DIR, d, "settings.ts"),
      "MapSettings",
    );
    return { dir: d, className };
  });

  const imports = entries
    .map(
      ({ dir, className }) =>
        `import { ${className} } from "./${dir}/settings";`,
    )
    .join("\n");

  const adds = entries
    .map(({ className }) => `    this.add(new ${className}());`)
    .join("\n");

  const content = `${GENERATED_HEADER}import { GameKey } from "../api/game_key";
import { MapSettings } from "../engine/game/map_settings";
import { assert } from "../utils/validate";
${imports}

export class MapRegistry {
  static readonly singleton = new MapRegistry();
  private readonly maps = new Map<GameKey, MapSettings>();

  private constructor() {
${adds}
  }

  values(): Iterable<MapSettings> {
    return this.maps.values();
  }

  get(key: GameKey): MapSettings {
    assert(this.maps.has(key), \`unfound maps with key \${key}\`);
    return this.maps.get(key)!;
  }

  private add(map: MapSettings): void {
    assert(!this.maps.has(map.key), \`duplicate maps with key \${map.key}\`);
    this.maps.set(map.key, map);
  }
}
`;

  writeFileSync(join(MAPS_DIR, "registry.ts"), content, "utf8");
}

function generateViewRegistry(dirs: string[]): void {
  const entries = dirs.map((d) => {
    const ext = existsSync(join(MAPS_DIR, d, "view_settings.ts"))
      ? "ts"
      : "tsx";
    const className = extractClassName(
      join(MAPS_DIR, d, `view_settings.${ext}`),
      "ViewSettings",
    );
    return { dir: d, className };
  });

  const imports = entries
    .map(
      ({ dir, className }) =>
        `import { ${className} } from "./${dir}/view_settings";`,
    )
    .join("\n");

  const adds = entries
    .map(({ className }) => `    this.add(new ${className}());`)
    .join("\n");

  const content = `${GENERATED_HEADER}import { GameKey } from "../api/game_key";
import { MapViewSettings } from "./view_settings";
import { assert } from "../utils/validate";
${imports}

export class ViewRegistry {
  static readonly singleton = new ViewRegistry();
  private readonly maps = new Map<GameKey, MapViewSettings>();

  private constructor() {
${adds}
  }

  values(): Iterable<MapViewSettings> {
    return this.maps.values();
  }

  get(key: GameKey): MapViewSettings {
    assert(this.maps.has(key), \`unfound maps with key \${key}\`);
    return this.maps.get(key)!;
  }

  private add(map: MapViewSettings): void {
    assert(!this.maps.has(map.key), \`duplicate maps with key \${map.key}\`);
    this.maps.set(map.key, map);
  }
}
`;

  writeFileSync(join(MAPS_DIR, "view_registry.ts"), content, "utf8");
}

if (require.main === module) {
  generateRegistries();
  process.stdout.write("Generated registry.ts and view_registry.ts\n");
}
