import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

require.extensions[".css"] = () => {};
require.extensions[".svg"] = () => {};

export default {
  spec_dir: "",
  spec_files: [
    "src/**/*_test.ts",
    "src/**/*_test.tsx",
    "!src/e2e/*",
    "!src/prober/*",
  ],
  jsLoader: "require",
  env: {
    stopSpecOnExpectationFailure: false,
    random: true,
    forbidDuplicateNames: true,
  },
};
