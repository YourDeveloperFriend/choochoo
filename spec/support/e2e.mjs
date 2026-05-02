export default {
  spec_dir: "",
  spec_files: ["src/e2e/**/*_test.ts"],
  jsLoader: "require",
  env: {
    stopSpecOnExpectationFailure: false,
    random: true,
    forbidDuplicateNames: true,
  },
};
