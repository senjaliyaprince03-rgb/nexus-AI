import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptsDir, "..");
const mode = process.argv.includes("--build") ? "build" : "dev";

const targets =
  mode === "build"
    ? [".next"]
    : [path.join(".next", "cache", "webpack")];

for (const relativeTarget of targets) {
  const target = path.resolve(frontendDir, relativeTarget);
  const isInsideFrontend =
    target === frontendDir || target.startsWith(`${frontendDir}${path.sep}`);

  if (!isInsideFrontend) {
    throw new Error(`Refusing to remove path outside frontend: ${target}`);
  }

  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
    console.log(`[clean-next-artifacts] removed ${path.relative(frontendDir, target)}`);
  }
}
