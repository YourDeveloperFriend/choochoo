import { readdir, stat, unlink } from "fs/promises";
import { resolve } from "path";
import { logError } from "../utils/functions";

async function* readdirRecursive(dir: string): AsyncIterable<string> {
  const files = await readdir(dir);
  for (const file of files) {
    const fullFilename = resolve(dir, file);
    const fileStats = await stat(fullFilename);
    if (fileStats.isDirectory()) {
      yield* readdirRecursive(fullFilename);
    } else {
      yield fullFilename;
    }
  }
}

async function removeDeleted() {
  const root = resolve("./");
  const binDir = resolve(root, "./bin");
  const srcDir = resolve(root, "./src");
  if (!(await fileExists(binDir))) {
    return;
  }
  for await (const jsFile of readdirRecursive(binDir)) {
    const tsFiles = toTsFiles({ root, binDir, srcDir, jsFile });
    if (tsFiles.length == 0) {
      continue;
    }

    const found = (await Promise.all(tsFiles.map(fileExists))).some(
      (exists) => exists,
    );
    if (!found) {
      await unlink(jsFile);
    }
  }
}

async function fileExists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch (e) {
    if (typeof e !== "object" || e == null) {
      throw e;
    }
    if (
      "message" in e &&
      (e as Error).message.startsWith("ENOENT: no such file or directory")
    ) {
      return false;
    }
    throw e;
  }
}

interface ToTsFileProps {
  root: string;
  binDir: string;
  srcDir: string;
  jsFile: string;
}

function toTsFiles({ binDir, srcDir, jsFile }: ToTsFileProps): string[] {
  const path = jsFile.substring(binDir.length + 1);
  const exts = [".js", ".js.map"];
  for (const ext of exts) {
    if (path.endsWith(ext)) {
      return [
        resolve(srcDir, path.substring(0, path.length - ext.length) + ".ts"),
        resolve(srcDir, path.substring(0, path.length - ext.length) + ".tsx"),
      ];
    }
  }
  return [];
}

removeDeleted().catch((e) => {
  logError("error removing deleted", e);
});
