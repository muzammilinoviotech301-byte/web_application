-- Registration form fields (consent checkboxes, terms) and the shopping cart.

alter table public.profiles
  add column if not exists contact_by_email boolean not null default false,
  add column if not exists contact_by_phone boolean not null default false,
  add column if not exists terms_accepted_at timestamptz;

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product text not null,
  plan text not null default '',
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists cart_items_user_id_idx on public.cart_items(user_id);
alter table public.cart_items enable row level security;

drop policy if exists cart_items_select_own on public.cart_items;
create policy cart_items_select_own on public.cart_items for select to authenticated using (auth.uid() = user_id);
drop policy if exists cart_items_insert_own on public.cart_items;
create policy cart_items_insert_own on public.cart_items for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists cart_items_update_own on public.cart_items;
create policy cart_items_update_own on public.cart_items for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists cart_items_delete_own on public.cart_items;
create policy cart_items_delete_own on public.cart_items for delete to authenticated using (auth.uid() = user_id);

-- Copy the consent fields from sign-up metadata into the new profile.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  first_name text := coalesce(meta ->> 'first_name', '');
  last_name text := coalesce(meta ->> 'last_name', '');
  computed_name text := nullif(concat_ws(' ', first_name, last_name), '');
begin
  insert into public.profiles (
    id, email, first_name, last_name, display_name, company, country,
    department, relationship, phone, contact_by_email, contact_by_phone, terms_accepted_at
  )
  values (
    new.id, coalesce(new.email, ''), first_name, last_name,
    coalesce(meta ->> 'display_name', computed_name, split_part(coalesce(new.email, ''), '@', 1), 'SAP User'),
    coalesce(meta ->> 'company', ''), coalesce(meta ->> 'country', 'Pakistan'),
    coalesce(meta ->> 'department', ''), coalesce(meta ->> 'relationship', ''), coalesce(meta ->> 'phone', ''),
    coalesce((meta ->> 'contact_by_email')::boolean, false),
    coalesce((meta ->> 'contact_by_phone')::boolean, false),
    case when coalesce((meta ->> 'terms_accepted')::boolean, false) then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
