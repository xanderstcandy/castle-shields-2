import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const logFile = path.join(root, ".cursor", "hooks", "push-to-render.log");
const EXCLUDED = [".agents", "skills-lock.json"];

function log(message) {
  appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
}

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function syntaxErrors(files) {
  const errors = [];
  for (const file of files) {
    if (!/\.(m?js)$/.test(file)) continue;
    const full = path.join(root, file);
    let source;
    try {
      source = readFileSync(full, "utf8");
    } catch {
      continue;
    }
    const isModule = file.endsWith(".mjs") || /^\s*(import|export)\s/m.test(source);
    const result = isModule
      ? spawnSync("node", ["--input-type=module", "--check"], { input: source, encoding: "utf8" })
      : spawnSync("node", ["--check", full], { encoding: "utf8" });
    if (result.status !== 0) errors.push(`${file}: ${(result.stderr || "").split("\n").slice(0, 4).join(" ")}`);
  }
  return errors;
}

function finish(message) {
  if (message) log(message);
  process.stdout.write("{}");
  process.exit(0);
}

try {
  readFileSync(0);
} catch {}

try {
  if (git("rev-parse", "--abbrev-ref", "HEAD") !== "main") finish("Skipped: not on main.");

  git("add", "-A", "--", ".", ...EXCLUDED.map((entry) => `:!${entry}`));
  const staged = git("diff", "--cached", "--name-only", "--diff-filter=ACMR").split("\n").filter(Boolean);
  const anyStaged = git("diff", "--cached", "--name-only").length > 0;

  if (anyStaged) {
    const errors = syntaxErrors(staged);
    if (errors.length) {
      git("reset", "-q");
      finish(`Not pushed, syntax errors:\n  ${errors.join("\n  ")}`);
    }
    const names = git("diff", "--cached", "--name-only").split("\n").filter(Boolean);
    const summary = names.slice(0, 6).map((name) => path.basename(name)).join(", ") + (names.length > 6 ? ` +${names.length - 6} more` : "");
    git("commit", "-q", "-m", `Update ${summary}`);
  }

  git("fetch", "-q", "origin", "main");
  const [behind, ahead] = git("rev-list", "--left-right", "--count", "origin/main...HEAD").split(/\s+/).map(Number);
  if (behind > 0) {
    try {
      git("pull", "-q", "--rebase", "--autostash", "origin", "main");
    } catch (error) {
      try { git("rebase", "--abort"); } catch {}
      finish(`Not pushed, could not rebase onto origin/main: ${error.message}`);
    }
  }
  if (ahead === 0 && behind === 0) finish();

  git("push", "-q", "origin", "main");
  finish(`Pushed ${git("rev-parse", "--short", "HEAD")} to origin/main; Render will deploy it.`);
} catch (error) {
  finish(`Failed: ${error.message}`);
}
