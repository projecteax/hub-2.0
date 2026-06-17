-- Break RLS recursion between validation_requests <-> validation_assignments.

create or replace function public.is_assigned_to_validation_request(target_request_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.validation_assignments va
    where va.validation_request_id = target_request_id
      and va.expert_user_id = auth.uid()
  );
$$;

create or replace function public.can_org_member_read_validation_request(target_request_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.validation_requests vr
    join public.research_projects p on p.id = vr.project_id
    where vr.id = target_request_id
      and public.is_org_member(p.organization_id)
  );
$$;

create or replace function public.is_expert_assignment(target_assignment_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.validation_assignments va
    where va.id = target_assignment_id
      and va.expert_user_id = auth.uid()
  );
$$;

create or replace function public.can_org_member_read_validation_flag(target_assignment_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.validation_assignments va
    join public.validation_requests vr on vr.id = va.validation_request_id
    join public.research_projects p on p.id = vr.project_id
    where va.id = target_assignment_id
      and public.is_org_member(p.organization_id)
  );
$$;

drop policy if exists "Experts read validation requests for assignments" on public.validation_requests;
create policy "Experts read validation requests for assignments" on public.validation_requests
  for select using (public.is_assigned_to_validation_request(id));

drop policy if exists "Members can read validation assignments" on public.validation_assignments;
create policy "Members can read validation assignments" on public.validation_assignments
  for select using (public.can_org_member_read_validation_request(validation_request_id));

drop policy if exists "Experts read own flags" on public.validation_flags;
create policy "Experts read own flags" on public.validation_flags
  for select using (public.is_expert_assignment(assignment_id));

drop policy if exists "Experts insert own flags" on public.validation_flags;
create policy "Experts insert own flags" on public.validation_flags
  for insert with check (public.is_expert_assignment(assignment_id));

drop policy if exists "Members can read validation flags" on public.validation_flags;
create policy "Members can read validation flags" on public.validation_flags
  for select using (public.can_org_member_read_validation_flag(assignment_id));
