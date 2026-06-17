import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

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
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

const password = process.env.SUPABASE_DB_PASSWORD;

if (!projectRef) {
  console.error("Missing SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

if (!password) {
  console.error("Missing SUPABASE_DB_PASSWORD in .env.local\n");
  console.log("Get it from Supabase Dashboard → Project Settings → Database → Database password");
  console.log(`https://supabase.com/dashboard/project/${projectRef}/settings/database\n`);
  console.log("Add to .env.local:");
  console.log("SUPABASE_DB_PASSWORD=your_database_password\n");
  console.log("Then run: npm run supabase:apply-expert-db");
  process.exit(1);
}

const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
const sqlPath = resolve(process.cwd(), "supabase/APPLY_EXPERT_MARKETPLACE.sql");
const sql = readFileSync(sqlPath, "utf8");

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log("✓ Expert marketplace migration applied successfully");
  console.log("Run: npm run supabase:check");
} catch (error) {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end();
}
