-- Report generation writes personas, responses, sections, and metrics.
-- Previously these tables were SELECT-only, which blocked AI expert research saves.

create policy "Members can insert personas" on public.virtual_expert_personas
  for insert
  with check (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can update personas" on public.virtual_expert_personas
  for update
  using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can delete personas" on public.virtual_expert_personas
  for delete
  using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can insert expert responses" on public.virtual_expert_responses
  for insert
  with check (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can update expert responses" on public.virtual_expert_responses
  for update
  using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can delete expert responses" on public.virtual_expert_responses
  for delete
  using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can insert report sections" on public.report_sections
  for insert
  with check (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can update report sections" on public.report_sections
  for update
  using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can delete report sections" on public.report_sections
  for delete
  using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can insert report metrics" on public.report_metrics
  for insert
  with check (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can update report metrics" on public.report_metrics
  for update
  using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );

create policy "Members can delete report metrics" on public.report_metrics
  for delete
  using (
    exists (
      select 1 from public.research_projects p
      where p.id = project_id and public.is_org_member(p.organization_id)
    )
  );
