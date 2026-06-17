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
begin
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

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
