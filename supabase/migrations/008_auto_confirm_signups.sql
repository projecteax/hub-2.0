-- Auto-confirm new signups so QA can create test accounts without email verification.
-- Also ensure local config: auth.email.enable_confirmations = false in config.toml.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  organization_id uuid;
  organization_name text;
  organization_slug text;
  account_type text;
  expertise_raw text;
begin
  -- confirmed_at is generated (LEAST(email_confirmed_at, phone_confirmed_at)); only set email_confirmed_at.
  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, timezone('utc', now()))
  where id = new.id;

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
