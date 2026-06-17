create extension if not exists "pgcrypto";
create extension if not exists "vector";

create type public.app_role as enum ('client_admin', 'client_member', 'newtonx_admin');
create type public.project_status as enum ('draft', 'scoping', 'brief_ready', 'generating', 'report_ready', 'validation_requested');
create type public.evidence_state as enum ('ai_simulated', 'historical_source_supported', 'human_validated');
create type public.validation_status as enum ('not_requested', 'requested', 'in_progress', 'complete');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  industry_code text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  role app_role not null default 'client_admin',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role app_role not null default 'client_member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.research_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  status project_status not null default 'draft',
  decision_context text,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.research_questions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  original_question text not null,
  canonical_question text not null,
  question_fingerprint text not null,
  normalized_scope jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.research_briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  version integer not null default 1,
  industry_code text not null,
  geography_code text not null,
  market_segment text not null,
  company_size_band text not null,
  research_type text not null,
  decision_stakes text not null,
  structured_brief jsonb not null,
  methodology jsonb not null,
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

create table public.adaptive_form_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  completion_score numeric(5,2) not null default 0,
  current_step text not null default 'intent',
  missing_fields text[] not null default '{}',
  next_question_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.adaptive_form_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.adaptive_form_sessions(id) on delete cascade,
  field_key text not null,
  question_text text not null,
  answer_text text not null,
  normalized_value jsonb not null default '{}'::jsonb,
  rationale text,
  created_at timestamptz not null default now()
);

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.research_projects(id) on delete cascade,
  provider text not null default 'google',
  model text not null,
  service_name text not null,
  prompt_version text not null,
  input_hash text not null,
  output_hash text,
  temperature numeric(3,2) not null default 0.20,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'started',
  token_usage jsonb not null default '{}'::jsonb,
  cost_estimate numeric(10,4),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.virtual_expert_personas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  persona_key text not null,
  segment text not null,
  seniority text not null,
  geography text not null,
  industry_experience text not null,
  company_size_band text not null,
  metadata jsonb not null default '{}'::jsonb,
  disclaimer_state evidence_state not null default 'ai_simulated',
  created_at timestamptz not null default now()
);

create table public.virtual_expert_responses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  persona_id uuid references public.virtual_expert_personas(id) on delete set null,
  question_key text not null,
  answer_value jsonb not null,
  confidence numeric(4,3) not null,
  reasoning_summary text,
  quality_flags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.report_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  section_key text not null,
  title text not null,
  content text not null,
  confidence_level numeric(4,3) not null,
  evidence_state evidence_state not null default 'ai_simulated',
  citations jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.report_metrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  metric_key text not null,
  title text not null,
  chart_type text not null,
  data jsonb not null,
  segment_cuts jsonb not null default '{}'::jsonb,
  confidence_interval jsonb not null default '{}'::jsonb,
  evidence_state evidence_state not null default 'ai_simulated',
  created_at timestamptz not null default now()
);

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null,
  source_type text not null default 'mock_report',
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.source_chunks (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references public.source_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  page_number integer,
  coordinates jsonb not null default '{}'::jsonb,
  embedding vector(768),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_document_id, chunk_index)
);

create table public.validation_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  status validation_status not null default 'requested',
  target_expert_count integer not null default 30,
  cost_estimate numeric(10,2),
  sla_hours integer not null default 48,
  validation_scope jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  project_id uuid references public.research_projects(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index research_projects_org_idx on public.research_projects(organization_id);
create index research_questions_fingerprint_idx on public.research_questions(question_fingerprint);
create index research_briefs_scope_idx on public.research_briefs(industry_code, geography_code, market_segment);
create index ai_runs_project_idx on public.ai_runs(project_id, service_name);
create index report_metrics_project_idx on public.report_metrics(project_id);
create index audit_events_project_idx on public.audit_events(project_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
create trigger research_projects_touch_updated_at before update on public.research_projects for each row execute function public.touch_updated_at();
create trigger adaptive_form_sessions_touch_updated_at before update on public.adaptive_form_sessions for each row execute function public.touch_updated_at();
create trigger validation_requests_touch_updated_at before update on public.validation_requests for each row execute function public.touch_updated_at();

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
  );
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.research_projects enable row level security;
alter table public.research_questions enable row level security;
alter table public.research_briefs enable row level security;
alter table public.adaptive_form_sessions enable row level security;
alter table public.adaptive_form_answers enable row level security;
alter table public.ai_runs enable row level security;
alter table public.virtual_expert_personas enable row level security;
alter table public.virtual_expert_responses enable row level security;
alter table public.report_sections enable row level security;
alter table public.report_metrics enable row level security;
alter table public.source_documents enable row level security;
alter table public.source_chunks enable row level security;
alter table public.validation_requests enable row level security;
alter table public.audit_events enable row level security;

create policy "Members can read organizations" on public.organizations
  for select using (public.is_org_member(id));

create policy "Users can read own profile" on public.profiles
  for select using (id = auth.uid());

create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Members can read memberships" on public.organization_members
  for select using (public.is_org_member(organization_id));

create policy "Members can manage projects" on public.research_projects
  for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

create policy "Members can manage project questions" on public.research_questions
  for all using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  ) with check (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can manage project briefs" on public.research_briefs
  for all using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  ) with check (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can manage form sessions" on public.adaptive_form_sessions
  for all using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  ) with check (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can manage form answers" on public.adaptive_form_answers
  for all using (
    exists (
      select 1
      from public.adaptive_form_sessions s
      join public.research_projects p on p.id = s.project_id
      where s.id = session_id and public.is_org_member(p.organization_id)
    )
  ) with check (
    exists (
      select 1
      from public.adaptive_form_sessions s
      join public.research_projects p on p.id = s.project_id
      where s.id = session_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can read AI runs" on public.ai_runs
  for select using (
    project_id is null or exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can read personas" on public.virtual_expert_personas
  for select using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can read responses" on public.virtual_expert_responses
  for select using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can read report sections" on public.report_sections
  for select using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can read report metrics" on public.report_metrics
  for select using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can read source documents" on public.source_documents
  for select using (organization_id is null or public.is_org_member(organization_id));

create policy "Members can read source chunks" on public.source_chunks
  for select using (
    exists (
      select 1 from public.source_documents d
      where d.id = source_document_id
        and (d.organization_id is null or public.is_org_member(d.organization_id))
    )
  );

create policy "Members can manage validation requests" on public.validation_requests
  for all using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  ) with check (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can read audit events" on public.audit_events
  for select using (organization_id is null or public.is_org_member(organization_id));
