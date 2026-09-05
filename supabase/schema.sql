-- Supabase schema for Partes de Trabajo application

create table if not exists users (
  id uuid primary key,
  nombre text not null,
  email text unique not null,
  rol text not null check (rol in ('trabajador', 'administrador')),
  avatar_url text
);

-- idempotent for databases created before avatar_url existed
alter table users add column if not exists avatar_url text;

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null
);

create table if not exists obras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cliente_id uuid references clientes(id) on delete cascade
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'parte_estado') then
    create type parte_estado as enum ('pendiente', 'revisado');
  end if;
end $$;

create table if not exists partes (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references users(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete restrict,
  obra_id uuid not null references obras(id) on delete restrict,
  fecha date not null,
  horas numeric not null,
  descripcion text not null,
  materiales text,
  observaciones text,
  firma_url text,
  estado parte_estado not null default 'pendiente',
  created_at timestamp with time zone not null default now()
);

create table if not exists fotosparte (
  id uuid primary key default gen_random_uuid(),
  parte_id uuid not null references partes(id) on delete cascade,
  foto_url text not null
);

-- Admin-created reminders asking a trabajador to log a parte for a given cliente
-- (optionally scoped to a specific obra). Auto-resolved when a matching parte is created.
create table if not exists avisos (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null,
  cliente_id uuid not null,
  obra_id uuid,
  creado_por uuid not null,
  nota text,
  resuelto boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint avisos_trabajador_id_fkey foreign key (trabajador_id) references users(id) on delete cascade,
  constraint avisos_cliente_id_fkey foreign key (cliente_id) references clientes(id) on delete cascade,
  constraint avisos_obra_id_fkey foreign key (obra_id) references obras(id) on delete set null,
  constraint avisos_creado_por_fkey foreign key (creado_por) references users(id) on delete cascade
);

-- RLS policies for secure access
alter table users enable row level security;
alter table clientes enable row level security;
alter table obras enable row level security;
alter table partes enable row level security;
alter table fotosparte enable row level security;
alter table avisos enable row level security;

drop policy if exists "Allow authenticated users to read own profile" on users;
drop policy if exists "Allow administrador read all profiles" on users;
drop policy if exists "Allow authenticated insert own profile" on users;
drop policy if exists "Allow users update own profile except rol" on users;
drop policy if exists "Allow authenticated read clientes" on clientes;
drop policy if exists "Allow administrador manage clientes" on clientes;
drop policy if exists "Allow authenticated read obras" on obras;
drop policy if exists "Allow administrador manage obras" on obras;
drop policy if exists "Allow trabajadores access to own partes" on partes;
drop policy if exists "Allow trabajadores insert partes" on partes;
drop policy if exists "Allow trabajadores update own partes if pending" on partes;
drop policy if exists "Allow administrador manage all partes" on partes;
drop policy if exists "Allow authenticated read fotosparte" on fotosparte;
drop policy if exists "Allow insert fotosparte if part belongs to user" on fotosparte;
drop policy if exists "Allow delete fotosparte if part belongs to user" on fotosparte;
drop policy if exists "Allow trabajador read own avisos" on avisos;
drop policy if exists "Allow trabajador resolve own avisos" on avisos;
drop policy if exists "Allow administrador manage avisos" on avisos;
drop policy if exists "Allow authenticated read partes bucket objects" on storage.objects;
drop policy if exists "Allow authenticated uploads to partes bucket" on storage.objects;
drop policy if exists "Allow authenticated update to partes bucket" on storage.objects;

create policy "Allow authenticated users to read own profile" on users
  for select using (auth.uid() = id);

-- security definer so this bypasses RLS internally; a plain subquery against
-- `users` inside a policy defined on `users` itself causes infinite recursion (42P17).
create or replace function public.is_administrador()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from users where id = auth.uid() and rol = 'administrador'
  );
$$;

create policy "Allow administrador read all profiles" on users
  for select using (public.is_administrador());

create policy "Allow authenticated insert own profile" on users
  for insert with check (auth.uid() = id);

-- security definer so this reads the pre-update rol without recursing into this
-- table's own RLS; used to stop a user from self-promoting via a raw PATCH.
create or replace function public.current_rol()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select rol from users where id = auth.uid();
$$;

create policy "Allow users update own profile except rol" on users
  for update using (auth.uid() = id)
  with check (auth.uid() = id and rol = public.current_rol());

create policy "Allow authenticated read clientes" on clientes
  for select using (auth.role() in ('authenticated'));

create policy "Allow administrador manage clientes" on clientes
  for all using (
    exists (
      select 1 from users where users.id = auth.uid() and users.rol = 'administrador'
    )
  ) with check (
    exists (
      select 1 from users where users.id = auth.uid() and users.rol = 'administrador'
    )
  );

create policy "Allow authenticated read obras" on obras
  for select using (auth.role() in ('authenticated'));

create policy "Allow administrador manage obras" on obras
  for all using (
    exists (
      select 1 from users where users.id = auth.uid() and users.rol = 'administrador'
    )
  ) with check (
    exists (
      select 1 from users where users.id = auth.uid() and users.rol = 'administrador'
    )
  );

create policy "Allow trabajadores access to own partes" on partes
  for select using (
    auth.role() in ('authenticated') and (
      auth.uid() = trabajador_id or exists (
        select 1 from users where users.id = auth.uid() and users.rol = 'administrador'
      )
    )
  );

create policy "Allow trabajadores insert partes" on partes
  for insert with check (
    auth.uid() = trabajador_id
  );

create policy "Allow trabajadores update own partes if pending" on partes
  for update using (
    auth.uid() = trabajador_id and estado = 'pendiente'
  ) with check (
    auth.uid() = trabajador_id and estado = 'pendiente'
  );

create policy "Allow administrador manage all partes" on partes
  for all using (
    exists (
      select 1 from users where users.id = auth.uid() and users.rol = 'administrador'
    )
  );

create policy "Allow authenticated read fotosparte" on fotosparte
  for select using (auth.role() in ('authenticated'));

create policy "Allow insert fotosparte if part belongs to user" on fotosparte
  for insert with check (
    exists (
      select 1 from partes where partes.id = parte_id and partes.trabajador_id = auth.uid()
    )
  );

create policy "Allow delete fotosparte if part belongs to user" on fotosparte
  for delete using (
    exists (
      select 1 from partes where partes.id = parte_id and partes.trabajador_id = auth.uid()
    )
  );

create policy "Allow trabajador read own avisos" on avisos
  for select using (trabajador_id = auth.uid());

create policy "Allow trabajador resolve own avisos" on avisos
  for update using (trabajador_id = auth.uid())
  with check (trabajador_id = auth.uid());

create policy "Allow administrador manage avisos" on avisos
  for all using (public.is_administrador())
  with check (public.is_administrador());

-- Storage: the 'partes' bucket (firmas/ and fotos/ paths) is created via the Supabase
-- dashboard/Storage API, not by this script. It is public for reads, but uploads still
-- go through RLS on storage.objects, so authenticated users need explicit policies.
create policy "Allow authenticated read partes bucket objects" on storage.objects
  for select to authenticated
  using (bucket_id = 'partes');

create policy "Allow authenticated uploads to partes bucket" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'partes');

create policy "Allow authenticated update to partes bucket" on storage.objects
  for update to authenticated
  using (bucket_id = 'partes')
  with check (bucket_id = 'partes');
