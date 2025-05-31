export default {
  spec_dir: "",
  spec_files: ["src/prober/**/*_test.ts"],
  env: {
    stopSpecOnExpectationFailure: false,
    random: true,
    forbidDuplicateNames: true,
  },
};
