-- QA marketplace: experts can read all report-ready projects and related artifacts.

drop policy if exists "Experts read QA marketplace projects" on public.research_projects;
create policy "Experts read QA marketplace projects" on public.research_projects
  for select using (
    public.is_expert()
    and status in ('report_ready', 'validation_requested', 'human_verified')
  );

drop policy if exists "Experts read QA marketplace briefs" on public.research_briefs;
create policy "Experts read QA marketplace briefs" on public.research_briefs
  for select using (
    public.is_expert()
    and exists (
      select 1 from public.research_projects p
      where p.id = project_id
        and p.status in ('report_ready', 'validation_requested', 'human_verified')
    )
  );

drop policy if exists "Experts read QA marketplace questions" on public.research_questions;
create policy "Experts read QA marketplace questions" on public.research_questions
  for select using (
    public.is_expert()
    and exists (
      select 1 from public.research_projects p
      where p.id = project_id
        and p.status in ('report_ready', 'validation_requested', 'human_verified')
    )
  );

drop policy if exists "Experts read QA marketplace sections" on public.report_sections;
create policy "Experts read QA marketplace sections" on public.report_sections
  for select using (
    public.is_expert()
    and exists (
      select 1 from public.research_projects p
      where p.id = project_id
        and p.status in ('report_ready', 'validation_requested', 'human_verified')
    )
  );

drop policy if exists "Experts read QA marketplace metrics" on public.report_metrics;
create policy "Experts read QA marketplace metrics" on public.report_metrics
  for select using (
    public.is_expert()
    and exists (
      select 1 from public.research_projects p
      where p.id = project_id
        and p.status in ('report_ready', 'validation_requested', 'human_verified')
    )
  );

drop policy if exists "Experts read QA marketplace personas" on public.virtual_expert_personas;
create policy "Experts read QA marketplace personas" on public.virtual_expert_personas
  for select using (
    public.is_expert()
    and exists (
      select 1 from public.research_projects p
      where p.id = project_id
        and p.status in ('report_ready', 'validation_requested', 'human_verified')
    )
  );

drop policy if exists "Experts read QA marketplace responses" on public.virtual_expert_responses;
create policy "Experts read QA marketplace responses" on public.virtual_expert_responses
  for select using (
    public.is_expert()
    and exists (
      select 1 from public.research_projects p
      where p.id = project_id
        and p.status in ('report_ready', 'validation_requested', 'human_verified')
    )
  );
