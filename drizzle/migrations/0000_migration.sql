create type public.app_role as enum ('paciente', 'medico');
create type public.appointment_status as enum ('pendente', 'confirmada', 'concluida');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Usuário vê os próprios papéis" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create policy "Usuário vê o próprio perfil" on public.profiles
  for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(), 'medico'));
create policy "Usuário edita o próprio perfil" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  specialty text not null check (char_length(specialty) between 2 and 80),
  preferred_date date not null,
  reason text not null check (char_length(reason) between 3 and 500),
  status public.appointment_status not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert on public.appointments to authenticated;
grant update (status, updated_at) on public.appointments to authenticated;
grant all on public.appointments to service_role;
alter table public.appointments enable row level security;

create policy "Paciente vê as próprias solicitações" on public.appointments
  for select to authenticated using (patient_id = auth.uid() or public.has_role(auth.uid(), 'medico'));
create policy "Paciente cria solicitação própria" on public.appointments
  for insert to authenticated with check (
    patient_id = auth.uid() and status = 'pendente' and public.has_role(auth.uid(), 'paciente'));
create policy "Médico altera status" on public.appointments
  for update to authenticated using (public.has_role(auth.uid(), 'medico'))
  with check (public.has_role(auth.uid(), 'medico'));

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger appointments_touch before update on public.appointments
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(left(new.raw_user_meta_data->>'full_name', 100), ''));
  insert into public.user_roles (user_id, role) values (new.id, 'paciente');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();