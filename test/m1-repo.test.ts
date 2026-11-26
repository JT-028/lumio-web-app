import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

// Wherever this checkout lives: the main checkout, a git worktree, or CI on Linux.
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PARENT = fileURLToPath(new URL("../..", import.meta.url));

/** One spelling per directory: real path, forward slashes, no trailing slash, case-folded on Windows. */
function samePath(path: string): string {
  const real = realpathSync.native(path).replaceAll("\\", "/").replace(/\/+$/, "");
  return process.platform === "win32" ? real.toLowerCase() : real;
}

test(".env.example lists key names and contains no secret values", () => {
  const text = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL",
  ];
  for (const name of required) {
    assert.match(text, new RegExp(`^${name}=`, "m"), `${name} is missing`);
  }
  const lines = text.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"));
  assert.ok(lines.length >= required.length);
  for (const line of lines) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    assert.ok(match, `expected a key name, got ${line}`);
    assert.equal(match[2].trim(), "", `${match[1]} must not contain a secret value`);
  }
});

test("lumio-web-app is its own git repo and sibling repos have no Lumio commits", () => {
  const top = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(samePath(top), samePath(ROOT));
  const tracked = execFileSync("git", ["ls-files", "--", ".env", ".env.local", ".env.example"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.match(tracked, /(^|\n)\.env\.example(\n|$)/);
  assert.doesNotMatch(tracked, /(^|\n)\.env(\n|$)/);
  assert.doesNotMatch(tracked, /\.env\.local/);

  // Present beside the main checkout only. A worktree or CI run has none, so it skips them.
  const siblings = [join(PARENT, "booklet-app"), join(PARENT, "grade6-reviewers")];
  for (const sibling of siblings) {
    if (!existsSync(sibling)) {
      continue;
    }
    const log = execFileSync(
      "git",
      ["-C", sibling, "log", "--all", "-i", "--grep=Lumio", "--oneline"],
      { encoding: "utf8" },
    );
    assert.equal(log.trim(), "", `${sibling} has a Lumio commit`);
  }
});
