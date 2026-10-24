/**
 * Build identity, inlined at build time by next.config.ts (`env`). Every
 * deploy is a new build, so these identify exactly what is being served.
 */
export const buildInfo = {
  commit: process.env.BUILD_COMMIT ?? "unknown",
  branch: process.env.BUILD_BRANCH ?? "unknown",
  env: process.env.BUILD_ENV ?? "local",
  builtAt: process.env.BUILD_TIME ?? "",
};

/** Footer stamp ("build 1a2b3c4"): shown unless SHOW_BUILD_STAMP=off. */
export const showBuildStamp = process.env.SHOW_BUILD_STAMP !== "off";

export const shortCommit = buildInfo.commit.slice(0, 7);
