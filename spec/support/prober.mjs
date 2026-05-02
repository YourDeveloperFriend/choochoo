export default {
  spec_dir: "",
  spec_files: ["src/prober/**/*_test.ts"],
  jsLoader: "require",
  env: {
    stopSpecOnExpectationFailure: false,
    random: true,
    forbidDuplicateNames: true,
  },
};
