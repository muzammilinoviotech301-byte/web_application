-- Initial schema for the SAP website clone backend.
-- Run with: supabase db push  (or paste into the Supabase SQL editor).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  display_name text not null default '',
  company text not null default '',
  country text not null default 'Pakistan',
  department text not null default '',
  relationship text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product text not null,
  created_at timestamptz not null default now(),
  unique (user_id, product)
);

create table if not exists public.email_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, topic)
);

create table if not exists public.dashboard_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_trials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  status text not null default 'recommended' check (status in ('active', 'recommended', 'expired')),
  created_at timestamptz not null default now()
);

create table if not exists public.user_learnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  kind text not null default 'course' check (kind in ('course', 'tutorial', 'journey')),
  status text not null default 'active' check (status in ('active', 'completed', 'recommended')),
  created_at timestamptz not null default now()
);

create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  status text not null default 'recommended' check (status in ('recommended', 'registered', 'past')),
  created_at timestamptz not null default now()
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  url text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  sender text not null default 'SAP',
  body text not null default '',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_number text not null,
  status text not null default 'open',
  total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, order_number)
);

create index if not exists user_interests_user_id_idx on public.user_interests(user_id);
create index if not exists email_preferences_user_id_idx on public.email_preferences(user_id);
create index if not exists user_trials_user_id_idx on public.user_trials(user_id);
create index if not exists user_learnings_user_id_idx on public.user_learnings(user_id);
create index if not exists user_events_user_id_idx on public.user_events(user_id);
create index if not exists saved_items_user_id_idx on public.saved_items(user_id);
create index if not exists inbox_messages_user_id_idx on public.inbox_messages(user_id);
create index if not exists orders_user_id_idx on public.orders(user_id);

-- ---------------------------------------------------------------------------
-- Timestamps
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists email_preferences_set_updated_at on public.email_preferences;
create trigger email_preferences_set_updated_at
before update on public.email_preferences
for each row execute function public.set_updated_at();

drop trigger if exists dashboard_state_set_updated_at on public.dashboard_state;
create trigger dashboard_state_set_updated_at
before update on public.dashboard_state
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Create a profile automatically on sign-up
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  first_name text := coalesce(meta ->> 'first_name', '');
  last_name text := coalesce(meta ->> 'last_name', '');
  computed_name text := nullif(concat_ws(' ', first_name, last_name), '');
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    company,
    country,
    department,
    relationship,
    phone
  )
  values (
    new.id,
    coalesce(new.email, ''),
    first_name,
    last_name,
    coalesce(meta ->> 'display_name', computed_name, split_part(coalesce(new.email, ''), '@', 1), 'SAP User'),
    coalesce(meta ->> 'company', ''),
    coalesce(meta ->> 'country', 'Pakistan'),
    coalesce(meta ->> 'department', ''),
    coalesce(meta ->> 'relationship', ''),
    coalesce(meta ->> 'phone', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_interests enable row level security;
alter table public.email_preferences enable row level security;
alter table public.dashboard_state enable row level security;
alter table public.user_trials enable row level security;
alter table public.user_learnings enable row level security;
alter table public.user_events enable row level security;
alter table public.saved_items enable row level security;
alter table public.inbox_messages enable row level security;
alter table public.orders enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- One policy set for every user-scoped table except profiles.
do $$
declare
  table_name text;
begin
  for table_name in
    select unnest(array[
      'user_interests',
      'email_preferences',
      'dashboard_state',
      'user_trials',
      'user_learnings',
      'user_events',
      'saved_items',
      'inbox_messages',
      'orders'
    ])
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)',
      table_name || '_select_own', table_name
    );

    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (auth.uid() = user_id)',
      table_name || '_insert_own', table_name
    );

    execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
    execute format(
      'create policy %I on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      table_name || '_update_own', table_name
    );

    execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (auth.uid() = user_id)',
      table_name || '_delete_own', table_name
    );
  end loop;
end;
$$;
