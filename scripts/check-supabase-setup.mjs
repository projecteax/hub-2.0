import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = process.env.SUPABASE_PROJECT_REF ?? url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log("Hub 2.0 — Supabase setup check\n");

if (!url) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

const sqlEditorUrl = projectRef
  ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
  : "https://supabase.com/dashboard (open your project → SQL Editor)";

if (!serviceKey) {
  console.log("SUPABASE_SERVICE_ROLE_KEY is empty.\n");
  console.log("Add service role key from Project Settings → API, then restart the dev server.\n");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { error: expertTableError } = await admin.from("expert_profiles").select("user_id").limit(1);

if (expertTableError?.message.includes("Could not find the table")) {
  console.error("Missing expert marketplace tables (expert_profiles).\n");
  console.log("Run this SQL in Supabase SQL Editor:");
  console.log(sqlEditorUrl);
  console.log("\n  → Paste: supabase/APPLY_EXPERT_MARKETPLACE.sql");
  console.log("  → Click Run");
  console.log("  → Retry Request verification\n");
  process.exit(1);
}

if (expertTableError) {
  console.error("expert_profiles check failed:", expertTableError.message);
  process.exit(1);
}

const { error: insertError } = await admin.from("virtual_expert_personas").insert({
  project_id: "00000000-0000-0000-0000-000000000000",
  persona_key: "setup-check",
  segment: "test",
  seniority: "test",
  geography: "test",
  industry_experience: "test",
  company_size_band: "test"
});

if (insertError?.message.includes("row-level security")) {
  console.error("Service role key is set but RLS still blocks writes — key may be wrong.");
  process.exit(1);
}

if (insertError && !insertError.message.includes("violates foreign key")) {
  console.error("Unexpected error:", insertError.message);
  process.exit(1);
}

console.log("✓ expert_profiles table exists");
console.log("✓ SUPABASE_SERVICE_ROLE_KEY bypasses RLS");
console.log("Expert verification and report generation should work.");
