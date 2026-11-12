-- Ejecutar una sola vez en Supabase Dashboard > SQL Editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  birth_date date not null,
  phone text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  accident_type text not null,
  input_data jsonb not null,
  results jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin(profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$ select exists(select 1 from public.profiles where id = profile_id and is_admin = true) $$;

alter table public.profiles enable row level security;
alter table public.simulations enable row level security;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "simulations own read" on public.simulations;
create policy "simulations own read" on public.simulations for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "simulations own insert" on public.simulations;
create policy "simulations own insert" on public.simulations for insert with check (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, birth_date, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'birth_date', '')::date,
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    birth_date = excluded.birth_date,
    phone = excluded.phone;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Después de crear una cuenta admin en la aplicación, marcarla así:
-- update public.profiles set is_admin = true where email = 'admin@ejemplo.com';
