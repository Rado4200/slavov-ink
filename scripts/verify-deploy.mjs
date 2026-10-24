#!/usr/bin/env node
/**
 * Confirms production serves the local HEAD commit.
 *
 * Usage: pnpm deploy:verify
 *
 * Reads the production URL from scripts/deploy.config.json, polls
 * <url>/version.json every 10 s for up to 10 min until its `commit` equals
 * `git rev-parse HEAD`, prints the result, and exits 1 on timeout. If it times
 * out, stop and ask for the Vercel build log.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { productionUrl } = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/deploy.config.json"), "utf8"),
);
const INTERVAL_MS = 10_000;
const TIMEOUT_MS = 10 * 60_000;

const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const url = new URL("/version.json", productionUrl);
const started = Date.now();
process.stdout.write(`Waiting for ${url.origin} to serve ${head.slice(0, 7)}...\n`);

for (let attempt = 1; ; attempt++) {
  let seen = "unreachable";
  try {
    url.searchParams.set("t", String(Date.now())); // bypass any intermediate cache
    const response = await fetch(url, { cache: "no-store" });
    if (response.ok) {
      const version = await response.json();
      seen = String(version.commit).slice(0, 7);
      if (version.commit === head) {
        process.stdout.write(
          `OK after ${Math.round((Date.now() - started) / 1000)} s\n${JSON.stringify(version, null, 2)}\n`,
        );
        process.exit(0);
      }
    } else {
      seen = `HTTP ${response.status}`;
    }
  } catch {
    // network error: keep polling
  }
  process.stdout.write(`  attempt ${attempt}: serving ${seen}\n`);
  if (Date.now() - started + INTERVAL_MS > TIMEOUT_MS) break;
  await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
}

process.stderr.write(
  `Timed out after 10 min: production does not serve ${head.slice(0, 7)}. Check the Vercel deployment log.\n`,
);
process.exit(1);
