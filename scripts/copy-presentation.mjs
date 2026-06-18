import { cpSync, existsSync, rmSync } from "fs";
import { join } from "path";

const root = process.cwd();
const src = join(root, "presentation", "dist");
const dest = join(root, "public", "presentation");

if (!existsSync(src)) {
  console.error("presentation/dist not found. Run: npm run presentation:build");
  process.exit(1);
}

if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true });
}

cpSync(src, dest, { recursive: true });
console.log("Copied presentation/dist → public/presentation");
