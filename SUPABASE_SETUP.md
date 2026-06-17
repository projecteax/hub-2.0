# Supabase setup for Hub 2.0

## 1. Create a Supabase project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Wait until provisioning finishes

## 2. Add app keys to `.env.local`

In Supabase: **Project Settings -> API**

Copy into `/Users/adriankasprzak/NewtonX - AI HUB/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROJECT_REF=YOUR_PROJECT_REF
GOOGLE_AI_API_KEY=your_research_api_key
```

Restart the dev server after saving:

```bash
npm run dev -- -p 3100
```

## 3. Connect Supabase MCP in Cursor

This workspace already includes `.cursor/mcp.json`.

1. Reload Cursor (`Cmd+Shift+P` -> **Developer: Reload Window**)
2. Open **Cursor Settings -> Tools & MCP**
3. Enable the `supabase` server
4. Complete the Supabase browser login when prompted

Optional: scope MCP to one project by editing `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&read_only=true"
    }
  }
}
```

After MCP is connected, you can ask the agent to apply migrations, inspect tables, and run SQL against your dev project.

## 4. Apply database schema

### Option A: Supabase Dashboard

Open **SQL Editor** and run, in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_auth_onboarding.sql`
3. `supabase/seed.sql` (optional demo data)

### Option B: Supabase CLI linked to your remote project

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npm run supabase:db:push
```

## 5. QA accounts (no email verification)

For easy test signups:

1. **Hosted Supabase:** Dashboard → **Authentication** → **Providers** → **Email** → disable **Confirm email**
2. **Apply migration 008** (`supabase/migrations/008_auto_confirm_signups.sql`) so new users are auto-confirmed in the database
3. Local dev already has `enable_confirmations = false` in `supabase/config.toml`

After signup, the app signs you in immediately (no inbox step).

## 6. Verify

- Sign up at `/login`
- Create a research brief at `/research/new`
- Confirm auth and project data are isolated per organization
