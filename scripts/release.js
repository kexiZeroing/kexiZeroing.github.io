import { readJSONSync } from "fs-extra/esm";
import { execSync } from "node:child_process";
import process from "node:process";

const { version: oldVersion } = readJSONSync("package.json");

// Update the version in package.json
execSync("npx bumpp --no-commit --no-tag --no-push", { stdio: "inherit" });

const { version } = readJSONSync("package.json");

if (oldVersion === version) {
  console.log("canceled");
  process.exit();
}

// Create the commit and tag
execSync("git add .", { stdio: "inherit" });
execSync(`git commit -m "chore: release v${version}"`, { stdio: "inherit" });
execSync(`git tag -a v${version} -m "v${version}"`, { stdio: "inherit" });
