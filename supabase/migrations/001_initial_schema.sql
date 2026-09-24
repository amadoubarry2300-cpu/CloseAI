-- CloseAI MVP schema for Supabase / PostgreSQL
-- Run in a fresh Supabase project. The service-role key must never be exposed client-side.
create extension if not exists pgcrypto;
create extension if not exists vector;

create type public.member_role as enum ('owner','admin','manager','agent','viewer');
create type public.conversation_status as enum ('open','closed','human_required','archived');
create type public.message_direction as enum ('inbound','outbound');
create type public.message_type as enum ('text','audio','image','document','system');
create type public.ai_mode as enum ('copilot','automatic');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  country text,
  language text default 'fr',
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  industry text,
  country text,
  timezone text default 'UTC',
  default_currency text default 'EUR',
  onboarding_completed boolean not null default false,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.member_role not null default 'agent',
  created_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','starter','pro','business')),
  status text not null default 'active',
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  limits jsonb not null default '{"conversations":50,"audio_minutes":0,"products":1}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  price numeric(14,2),
  currency text not null default 'EUR',
  benefits jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  conditions text,
  guarantee text,
  payment_link text,
  faq jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text,
  phone text not null,
  country text,
  status text default 'new',
  tags text[] not null default '{}',
  notes text,
  product_id uuid references public.products(id) on delete set null,
  potential_value numeric(14,2),
  last_interaction_at timestamptz,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, phone)
);

create table public.whatsapp_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  display_name text,
  phone_number text,
  phone_number_id text not null unique,
  business_account_id text,
  mode public.ai_mode not null default 'copilot',
  is_active boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.whatsapp_accounts is 'Contains Meta identifiers only. Access tokens stay in server environment variables or a secrets vault.';

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  whatsapp_account_id uuid references public.whatsapp_accounts(id) on delete set null,
  status public.conversation_status not null default 'open',
  channel text,
  intent text,
  interest_level text,
  objection text,
  sentiment text,
  urgency text,
  lead_score smallint check (lead_score between 0 and 100),
  next_action text,
  assigned_to uuid references public.users(id) on delete set null,
  human_takeover_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction public.message_direction not null,
  type public.message_type not null default 'text',
  content text,
  external_id text unique,
  media_id text,
  media_mime text,
  ai_generated boolean not null default false,
  ai_provider text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.message_audio (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  message_id uuid not null unique references public.messages(id) on delete cascade,
  storage_path text,
  duration_seconds numeric(10,2),
  transcription text,
  transcription_provider text,
  voice_id text,
  created_at timestamptz not null default now()
);

create table public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  type text not null default 'text',
  title text not null,
  content text,
  source_url text,
  storage_path text,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.objections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  type text not null,
  details text,
  source_message_id text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  scheduled_at timestamptz not null,
  message text,
  template_name text,
  status text not null default 'scheduled',
  requires_template boolean not null default false,
  created_by uuid references public.users(id),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  amount numeric(14,2) not null,
  currency text not null default 'EUR',
  status text not null default 'pending',
  payment_provider text,
  payment_reference text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.usage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null,
  quantity numeric(14,4) not null default 1,
  provider text,
  cost_usd numeric(14,6),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.ai_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  mode public.ai_mode not null default 'copilot',
  tone text not null default 'warm',
  languages text[] not null default '{fr}',
  response_length text not null default 'normal',
  voice text,
  voice_gender text,
  voice_speed numeric(3,2) default 1,
  auto_match_format boolean not null default true,
  auto_handoff boolean not null default true,
  safety_rules jsonb not null default '{"no_fabrication":true,"no_manipulation":true,"payment_human_validation":true}'::jsonb,
  updated_at timestamptz not null default now()
);

create index contacts_org_idx on public.contacts(organization_id);
create index conversations_org_status_idx on public.conversations(organization_id,status,updated_at desc);
create index messages_conversation_time_idx on public.messages(conversation_id,sent_at);
create index knowledge_org_idx on public.knowledge_base(organization_id,is_active);
create index usage_org_time_idx on public.usage(organization_id,occurred_at);
create index followups_due_idx on public.follow_ups(status,scheduled_at);

-- Current user organization membership helper, used by every tenant policy.
create or replace function public.user_organization_ids()
returns setof uuid language sql stable security definer set search_path=public as $$
  select organization_id from public.organization_members where user_id = auth.uid();
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select coalesce((select is_platform_admin from public.users where id=auth.uid()),false);
$$;

alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.products enable row level security;
alter table public.contacts enable row level security;
alter table public.whatsapp_accounts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_audio enable row level security;
alter table public.knowledge_base enable row level security;
alter table public.objections enable row level security;
alter table public.follow_ups enable row level security;
alter table public.sales enable row level security;
alter table public.usage enable row level security;
alter table public.ai_settings enable row level security;

create policy "read own profile" on public.users for select using (id=auth.uid());
create policy "update own profile" on public.users for update using (id=auth.uid()) with check (id=auth.uid() and is_platform_admin=false);
create policy "members read organizations" on public.organizations for select using (id in (select public.user_organization_ids()));
create policy "owners update organizations" on public.organizations for update using (id in (select organization_id from public.organization_members where user_id=auth.uid() and role in ('owner','admin')));
create policy "members read memberships" on public.organization_members for select using (organization_id in (select public.user_organization_ids()));

-- Uniform tenant isolation policies. Writes are also restricted to current user's organizations.
do $$
declare t text;
begin
  foreach t in array array['subscriptions','products','contacts','whatsapp_accounts','conversations','messages','message_audio','knowledge_base','objections','follow_ups','sales','usage','ai_settings'] loop
    execute format('create policy "tenant select" on public.%I for select using (organization_id in (select public.user_organization_ids()))',t);
    execute format('create policy "tenant insert" on public.%I for insert with check (organization_id in (select public.user_organization_ids()))',t);
    execute format('create policy "tenant update" on public.%I for update using (organization_id in (select public.user_organization_ids())) with check (organization_id in (select public.user_organization_ids()))',t);
    execute format('create policy "tenant delete" on public.%I for delete using (organization_id in (select public.user_organization_ids()))',t);
  end loop;
end $$;

-- Creates a profile, an isolated organization, owner membership and free subscription at signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare org_id uuid;
begin
  insert into public.users(id,full_name,country,language)
  values(new.id,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'country',coalesce(new.raw_user_meta_data->>'language','fr'));
  insert into public.organizations(name,industry,country,created_by)
  values(coalesce(nullif(new.raw_user_meta_data->>'company',''),'Mon entreprise'),new.raw_user_meta_data->>'industry',new.raw_user_meta_data->>'country',new.id)
  returning id into org_id;
  insert into public.organization_members(organization_id,user_id,role) values(org_id,new.id,'owner');
  insert into public.subscriptions(organization_id,plan) values(org_id,'free');
  insert into public.ai_settings(organization_id) values(org_id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Optional semantic knowledge search, kept tenant-scoped.
create or replace function public.match_knowledge(query_embedding vector(1536), match_count int, org_id uuid)
returns table(id uuid,title text,content text,similarity float)
language sql stable as $$
  select k.id,k.title,k.content,1-(k.embedding <=> query_embedding) as similarity
  from public.knowledge_base k
  where k.organization_id=org_id and k.is_active=true and k.embedding is not null
    and org_id in (select public.user_organization_ids())
  order by k.embedding <=> query_embedding limit match_count;
$$;
