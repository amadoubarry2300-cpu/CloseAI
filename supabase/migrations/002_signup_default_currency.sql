-- Use the country and currency selected during account creation for new organizations.
-- Existing organizations and the database-wide default remain unchanged.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  selected_currency text;
begin
  selected_currency := upper(coalesce(nullif(new.raw_user_meta_data->>'default_currency', ''), 'XOF'));

  insert into public.users(id, full_name, country, language)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'country',
    coalesce(new.raw_user_meta_data->>'language', 'fr')
  );

  insert into public.organizations(name, industry, country, default_currency, created_by)
  values (
    coalesce(nullif(new.raw_user_meta_data->>'company', ''), 'Mon entreprise'),
    new.raw_user_meta_data->>'industry',
    new.raw_user_meta_data->>'country',
    selected_currency,
    new.id
  )
  returning id into org_id;

  insert into public.organization_members(organization_id, user_id, role)
  values (org_id, new.id, 'owner');
  insert into public.subscriptions(organization_id, plan)
  values (org_id, 'free');
  insert into public.ai_settings(organization_id)
  values (org_id);

  return new;
end;
$$;
