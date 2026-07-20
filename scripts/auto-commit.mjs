import { execFileSync } from "node:child_process";

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
  });
}

function hasStagedChanges() {
  try {
    run("git", ["diff", "--cached", "--quiet"]);
    return false;
  } catch {
    return true;
  }
}

const message =
  process.argv.slice(2).join(" ").trim() ||
  `chore: auto commit workspace changes ${new Date().toISOString()}`;

run("git", ["add", "-A"], { stdio: "inherit" });

if (!hasStagedChanges()) {
  console.log("No changes to commit.");
  process.exit(0);
}

run("git", ["commit", "-m", message], { stdio: "inherit" });
