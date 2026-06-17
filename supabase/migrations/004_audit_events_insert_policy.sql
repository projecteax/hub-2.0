create policy "Members can insert audit events" on public.audit_events
  for insert
  with check (
    organization_id is not null
    and public.is_org_member(organization_id)
    and actor_id = auth.uid()
  );
