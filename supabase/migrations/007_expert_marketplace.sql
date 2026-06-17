-- Expert marketplace & human verification workflow

alter type public.app_role add value if not exists 'expert';
alter type public.project_status add value if not exists 'human_verified';

create type public.assignment_status as enum ('invited', 'in_review', 'submitted', 'declined');
create type public.review_verdict as enum ('verified', 'verified_with_flags', 'unable_to_verify');

create table public.expert_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  headline text not null default '',
  credentials text not null default '',
  expertise_tags text[] not null default '{}',
  industry_codes text[] not null default '{}',
  geography_codes text[] not null default '{}',
  seniority text,
  bio text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.validation_requests
  add column if not exists requested_by uuid references public.profiles(id) on delete set null,
  add column if not exists completed_at timestamptz;

create table public.validation_assignments (
  id uuid primary key default gen_random_uuid(),
  validation_request_id uuid not null references public.validation_requests(id) on delete cascade,
  expert_user_id uuid not null references public.profiles(id) on delete cascade,
  status assignment_status not null default 'invited',
  match_score numeric(5,2) not null default 0,
  invited_at timestamptz not null default now(),
  submitted_at timestamptz,
  verdict review_verdict,
  attested_name text,
  attested_credentials text,
  general_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (validation_request_id, expert_user_id)
);

create table public.validation_flags (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.validation_assignments(id) on delete cascade,
  section_key text,
  flag_type text not null default 'inaccurate',
  comment text not null,
  created_at timestamptz not null default now()
);

create index expert_profiles_industry_idx on public.expert_profiles using gin (industry_codes);
create index expert_profiles_geography_idx on public.expert_profiles using gin (geography_codes);
create index validation_assignments_expert_idx on public.validation_assignments(expert_user_id, status);
create index validation_flags_assignment_idx on public.validation_flags(assignment_id);

create trigger expert_profiles_touch_updated_at
  before update on public.expert_profiles
  for each row execute function public.touch_updated_at();

create trigger validation_assignments_touch_updated_at
  before update on public.validation_assignments
  for each row execute function public.touch_updated_at();

-- Auth onboarding: client vs expert signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_id uuid;
  organization_name text;
  organization_slug text;
  account_type text;
  expertise_raw text;
begin
  account_type := coalesce(new.raw_user_meta_data->>'account_type', 'client');

  if account_type = 'expert' then
    insert into public.profiles (id, full_name, company_name, role, onboarding_complete)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', new.email),
      null,
      'expert',
      true
    );

    expertise_raw := coalesce(new.raw_user_meta_data->>'expertise_tags', '');
    insert into public.expert_profiles (
      user_id,
      headline,
      credentials,
      expertise_tags,
      industry_codes,
      geography_codes,
      seniority,
      bio
    )
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'headline', ''),
      coalesce(new.raw_user_meta_data->>'credentials', ''),
      case when expertise_raw = '' then '{}'::text[] else string_to_array(expertise_raw, ',') end,
      case
        when coalesce(new.raw_user_meta_data->>'industry_codes', '') = '' then '{}'::text[]
        else string_to_array(new.raw_user_meta_data->>'industry_codes', ',')
      end,
      case
        when coalesce(new.raw_user_meta_data->>'geography_codes', '') = '' then '{}'::text[]
        else string_to_array(new.raw_user_meta_data->>'geography_codes', ',')
      end,
      new.raw_user_meta_data->>'seniority',
      new.raw_user_meta_data->>'bio'
    );

    insert into public.audit_events (actor_id, event_type, event_payload)
    values (new.id, 'expert.created', jsonb_build_object('email', new.email));

    return new;
  end if;

  organization_name := coalesce(new.raw_user_meta_data->>'company_name', split_part(new.email, '@', 2), 'New Client');
  organization_slug := lower(regexp_replace(organization_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8);

  insert into public.organizations (name, slug)
  values (organization_name, organization_slug)
  returning id into organization_id;

  insert into public.profiles (id, full_name, company_name, role, onboarding_complete)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    organization_name,
    'client_admin',
    false
  );

  insert into public.organization_members (organization_id, user_id, role)
  values (organization_id, new.id, 'client_admin');

  insert into public.audit_events (organization_id, actor_id, event_type, event_payload)
  values (organization_id, new.id, 'user.created', jsonb_build_object('email_domain', split_part(new.email, '@', 2)));

  return new;
end;
$$;

-- Helpers for RLS
create or replace function public.is_expert()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'expert'
  );
$$;

create or replace function public.is_assigned_expert(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.validation_assignments va
    join public.validation_requests vr on vr.id = va.validation_request_id
    where vr.project_id = target_project_id
      and va.expert_user_id = auth.uid()
  );
$$;

alter table public.expert_profiles enable row level security;
alter table public.validation_assignments enable row level security;
alter table public.validation_flags enable row level security;

create policy "Experts read own profile" on public.expert_profiles
  for select using (user_id = auth.uid());

create policy "Experts update own profile" on public.expert_profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Experts read peer profiles for marketplace context" on public.expert_profiles
  for select using (public.is_expert());

create policy "Experts read own assignments" on public.validation_assignments
  for select using (expert_user_id = auth.uid());

create policy "Experts update own assignments" on public.validation_assignments
  for update using (expert_user_id = auth.uid()) with check (expert_user_id = auth.uid());

create policy "Experts read own flags" on public.validation_flags
  for select using (
    exists (
      select 1 from public.validation_assignments va
      where va.id = assignment_id and va.expert_user_id = auth.uid()
    )
  );

create policy "Experts insert own flags" on public.validation_flags
  for insert with check (
    exists (
      select 1 from public.validation_assignments va
      where va.id = assignment_id and va.expert_user_id = auth.uid()
    )
  );

-- Experts read report data for assigned projects
create policy "Assigned experts read projects" on public.research_projects
  for select using (public.is_assigned_expert(id));

create policy "Assigned experts read briefs" on public.research_briefs
  for select using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_assigned_expert(p.id)
    )
  );

create policy "Assigned experts read questions" on public.research_questions
  for select using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_assigned_expert(p.id)
    )
  );

create policy "Assigned experts read report sections" on public.report_sections
  for select using (public.is_assigned_expert(project_id));

create policy "Assigned experts read report metrics" on public.report_metrics
  for select using (public.is_assigned_expert(project_id));

create policy "Assigned experts read personas" on public.virtual_expert_personas
  for select using (public.is_assigned_expert(project_id));

create policy "Assigned experts read responses" on public.virtual_expert_responses
  for select using (public.is_assigned_expert(project_id));

create policy "Experts read validation requests for assignments" on public.validation_requests
  for select using (
    exists (
      select 1 from public.validation_assignments va
      where va.validation_request_id = validation_requests.id and va.expert_user_id = auth.uid()
    )
  );

-- Service role / org members retain existing validation_requests policies
