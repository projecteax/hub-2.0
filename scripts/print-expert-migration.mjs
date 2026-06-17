import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index);
      const value = trimmed.slice(index + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnvLocal();

const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ??
  "YOUR_PROJECT_REF";

const sqlPath = resolve(process.cwd(), "supabase/APPLY_EXPERT_MARKETPLACE.sql");

console.log("Expert marketplace migration\n");
console.log("1. Open SQL Editor:");
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
console.log("2. Paste the contents of:");
console.log(`   ${sqlPath}\n`);
console.log("3. Click Run\n");
console.log("4. Verify:");
console.log("   npm run supabase:check\n");
