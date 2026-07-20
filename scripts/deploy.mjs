import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
  });
}

function runNodeScript(script, args = []) {
  run(process.execPath, [script, ...args], { stdio: "inherit" });
}

function hasStagedChanges() {
  try {
    run("git", ["diff", "--cached", "--quiet"]);
    return false;
  } catch {
    return true;
  }
}

function currentBranch() {
  return run("git", ["branch", "--show-current"]).trim();
}

const message =
  process.argv.slice(2).join(" ").trim() ||
  `chore: deploy workspace changes ${new Date().toISOString()}`;

if (!existsSync("node_modules")) {
  throw new Error("node_modules not found. Run npm install before deploy.");
}

console.log("Checking TypeScript...");
runNodeScript("./node_modules/typescript/bin/tsc", ["-b", "--noEmit"]);

console.log("Building production bundle...");
runNodeScript("./node_modules/vite/bin/vite.js", ["build"]);

console.log("Preparing git commit...");
run("git", ["add", "-A"], { stdio: "inherit" });

if (hasStagedChanges()) {
  run("git", ["commit", "-m", message], { stdio: "inherit" });
} else {
  console.log("No new changes to commit.");
}

const branch = currentBranch();
if (!branch) {
  throw new Error("Cannot deploy from detached HEAD.");
}

console.log(`Pushing ${branch} to GitHub...`);
run("git", ["push", "origin", branch], { stdio: "inherit" });
