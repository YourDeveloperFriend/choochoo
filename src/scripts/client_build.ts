import { exec } from "child_process";
import type { BuildResult, Plugin } from "esbuild";
import { existsSync, readdirSync } from "fs";
import { writeFile } from "fs/promises";
import { join, resolve } from "path";
import { log, logError } from "../utils/functions";

export async function buildApp({
  watch,
}: { watch?: boolean } = {}): Promise<void> {
  const { context } = await import("esbuild");
  const production = process.env.NODE_ENV === "production";
  const environmentVariables = ["NODE_ENV", "API_HOST", "SOCKET_HOST"];
  const plugins = [
    mapRegistryPlugin(),
    viewRegistryPlugin(),
    ...rebuildPlugins(),
  ];

  const ctx = await context({
    entryPoints: ["src/client/main.tsx"],
    bundle: true,
    minify: production,
    platform: "browser",
    jsx: "automatic",
    metafile: true,
    outfile: production ? "dist/index.min.js" : "dist/index.dev.js",
    treeShaking: true,
    sourcemap: true,
    loader: {
      ".svg": "text",
      ".png": "dataurl",
      ".woff": "dataurl",
      ".woff2": "dataurl",
      ".eot": "dataurl",
      ".ttf": "dataurl",
    },
    define: Object.fromEntries(
      environmentVariables.map((v) => [
        `process.env.${v}`,
        process.env[v] != null ? `"${process.env[v]}"` : "undefined",
      ]),
    ),
    plugins,
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild().catch((e) => {
      logError("error building", e);
      throw e;
    });
    await ctx.dispose();
  }
}

function mapRegistryPlugin(): Plugin {
  return {
    name: "map-registry",
    setup(build) {
      build.onLoad({ filter: /\/maps\/registry\.ts$/ }, () => {
        const mapsDir = resolve("src/maps");
        const dirs = readdirSync(mapsDir, { withFileTypes: true })
          .filter((d) => d.isDirectory() && d.name !== "template")
          .filter((d) => existsSync(join(mapsDir, d.name, "settings.ts")));

        const lines = [
          `import { GameKey } from '../api/game_key';`,
          `import { MapSettings } from '../engine/game/map_settings';`,
          `import { assert } from '../utils/validate';`,
          ...dirs.map(
            (d, i) =>
              `import { mapSettings as ms${i} } from './${d.name}/settings';`,
          ),
          `export class MapRegistry {`,
          `  static readonly singleton = new MapRegistry();`,
          `  private readonly maps = new Map<GameKey, MapSettings>();`,
          `  private constructor() {`,
          ...dirs.map((_, i) => `    this.maps.set(ms${i}.key, ms${i});`),
          `  }`,
          `  values(): Iterable<MapSettings> { return this.maps.values(); }`,
          `  get(key: GameKey): MapSettings {`,
          `    assert(this.maps.has(key), \`unfound maps with key \${key}\`);`,
          `    return this.maps.get(key)!;`,
          `  }`,
          `}`,
        ];

        return {
          contents: lines.join("\n"),
          resolveDir: mapsDir,
          loader: "ts",
        };
      });
    },
  };
}

function viewRegistryPlugin(): Plugin {
  return {
    name: "view-registry",
    setup(build) {
      build.onResolve({ filter: /^choochoo:view-registry$/ }, (args) => ({
        path: args.path,
        namespace: "choochoo-view-registry",
      }));

      build.onLoad(
        { filter: /.*/, namespace: "choochoo-view-registry" },
        () => {
          const mapsDir = resolve("src/maps");
          const dirs = readdirSync(mapsDir, { withFileTypes: true })
            .filter((d) => d.isDirectory() && d.name !== "template")
            .filter(
              (d) =>
                existsSync(join(mapsDir, d.name, "view_settings.ts")) ||
                existsSync(join(mapsDir, d.name, "view_settings.tsx")),
            );

          const lines = [
            ...dirs.map(
              (d, i) =>
                `import { viewSettings as vs${i} } from './${d.name}/view_settings';`,
            ),
            `export const allViewSettings = [${dirs.map((_, i) => `vs${i}`).join(", ")}];`,
          ];

          return {
            contents: lines.join("\n"),
            resolveDir: mapsDir,
            loader: "ts",
          };
        },
      );
    },
  };
}

function rebuildPlugins(): Plugin[] {
  return [
    {
      name: "rebuild-notify",
      async setup(build) {
        build.onEnd(logErrors);
        const { stdout } = await exec("tsc");
        stdout?.on("data", (d) => log(d));
      },
    },
  ];
}

async function logErrors(result: BuildResult) {
  log(`build ended with ${result.errors.length} errors`);
  for (const error of result.errors) {
    log("===================");
    log("Text: ", error.text);
    log("Detail: ", error.detail);
    log("location: ", error.location);
  }
  await writeFile(
    `buildmeta.${process.env.NODE_ENV}.json`,
    JSON.stringify(result.metafile),
  );
}

if (resolve(process.argv[1]) === resolve(__filename)) {
  buildApp();
}
