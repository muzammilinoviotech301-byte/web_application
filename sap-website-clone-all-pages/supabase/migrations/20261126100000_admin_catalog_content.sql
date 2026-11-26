-- Admin panel: editable catalog, page content and broadcast messages.
-- Adds new tables only; the existing user tables are unchanged.

-- Admins (by e-mail) ----------------------------------------------------------
create table if not exists public.app_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.app_admins enable row level security;
drop policy if exists app_admins_admin_all on public.app_admins;
create policy app_admins_admin_all on public.app_admins for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Catalog: trials, learning, events, demos, newsletters, store products,
-- product logins, what's-new items ---------------------------------------------
create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in (
    'trial', 'learning', 'event', 'demo', 'newsletter', 'product', 'product_login', 'whats_new'
  )),
  title text not null,
  description text not null default '',
  category text not null default '',
  url text not null default '',
  image_url text not null default '',
  price numeric(12, 2) not null default 0,
  badge text not null default '',
  meta jsonb not null default '{}'::jsonb,
  sort integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists catalog_items_kind_idx on public.catalog_items(kind, sort);

drop trigger if exists catalog_items_set_updated_at on public.catalog_items;
create trigger catalog_items_set_updated_at before update on public.catalog_items
for each row execute function public.set_updated_at();

alter table public.catalog_items enable row level security;
drop policy if exists catalog_items_read on public.catalog_items;
create policy catalog_items_read on public.catalog_items for select to anon, authenticated
  using (active or public.is_admin());
drop policy if exists catalog_items_admin_write on public.catalog_items;
create policy catalog_items_admin_write on public.catalog_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Page content overrides (account pages, feature notices) ---------------------
create table if not exists public.site_content (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_by text not null default '',
  updated_at timestamptz not null default now()
);
drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at before update on public.site_content
for each row execute function public.set_updated_at();

alter table public.site_content enable row level security;
drop policy if exists site_content_read on public.site_content;
create policy site_content_read on public.site_content for select to anon, authenticated using (true);
drop policy if exists site_content_admin_write on public.site_content;
create policy site_content_admin_write on public.site_content for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Messages the admin sends to every user's inbox -------------------------------
create table if not exists public.broadcast_messages (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  sender text not null default 'SAP',
  body text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.broadcast_messages enable row level security;
drop policy if exists broadcast_messages_read on public.broadcast_messages;
create policy broadcast_messages_read on public.broadcast_messages for select to authenticated
  using (active or public.is_admin());
drop policy if exists broadcast_messages_admin_write on public.broadcast_messages;
create policy broadcast_messages_admin_write on public.broadcast_messages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Table privileges (RLS above decides which rows) ------------------------------
grant select on public.catalog_items, public.site_content to anon;
grant select, insert, update, delete on
  public.app_admins, public.catalog_items, public.site_content, public.broadcast_messages
to authenticated;
