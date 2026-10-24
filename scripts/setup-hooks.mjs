#!/usr/bin/env node
/**
 * `prepare` script: points git at .githooks/ (pre-push quality gate).
 * Only acts inside a git checkout, and never fails: Vercel and other CI
 * installs have no .git directory or no need for hooks.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

try {
  if (fs.existsSync(path.join(root, ".git"))) {
    execFileSync("git", ["config", "core.hooksPath", ".githooks"], { cwd: root, stdio: "ignore" });
  }
} catch {
  // Never block an install over hooks.
}
