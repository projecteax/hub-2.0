create policy "Members can insert AI runs" on public.ai_runs
  for insert
  with check (
    project_id is null or exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can update AI runs" on public.ai_runs
  for update
  using (
    project_id is null or exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  )
  with check (
    project_id is null or exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );
