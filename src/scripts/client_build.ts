import { exec } from "child_process";
import type { BuildResult, Plugin } from "esbuild";
import { writeFile } from "fs/promises";
import { resolve } from "path";
import { log, logError } from "../utils/functions";

export async function buildApp({
  watch,
}: { watch?: boolean } = {}): Promise<void> {
  const { context } = await import("esbuild");
  const production = process.env.NODE_ENV === "production";
  const environmentVariables = ["NODE_ENV", "API_HOST", "SOCKET_HOST"];
  const plugins = [...rebuildPlugins()];

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
