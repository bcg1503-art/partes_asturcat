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

-- Sequence for auto-incrementing parte numbers (00001, 00002, etc.)
create sequence if not exists numero_parte_seq start 1 increment 1;

-- `partes` is the monthly header for a trabajador+cliente+mes/ano combination.
-- The individual work days live in `registros_parte` (see below). A single
-- parte can contain many registros, one per date worked.
create table if not exists partes (
  id uuid primary key default gen_random_uuid(),
  numero_parte integer not null unique default nextval('numero_parte_seq'),
  trabajador_id uuid not null references users(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete restrict,
  mes integer not null check (mes >= 1 and mes <= 12),
  ano integer not null,
  estado parte_estado not null default 'pendiente',
  created_at timestamp with time zone not null default now(),
  unique(trabajador_id, cliente_id, mes, ano)
);

-- Migration: older databases had fecha/horas/observaciones directly on `partes`
-- (one date per parte). Move that data into `registros_parte` before dropping
-- the columns, so nothing is lost when this script is re-applied.
create table if not exists registros_parte (
  id uuid primary key default gen_random_uuid(),
  parte_id uuid not null references partes(id) on delete cascade,
  fecha date not null,
  horas numeric not null check (horas >= 0),
  observaciones text,
  created_at timestamp with time zone not null default now()
);

do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'partes' and column_name = 'fecha') then
    insert into registros_parte (parte_id, fecha, horas, observaciones, created_at)
    select id, fecha, horas, observaciones, created_at from partes where fecha is not null;

    alter table partes drop column fecha;
    alter table partes drop column horas;
    alter table partes drop column observaciones;
  end if;
end $$;

-- Legacy fields from the old, more detailed parte form. No longer collected
-- anywhere in the app; drop them if an older database still has them.
alter table partes drop column if exists obra_id;
alter table partes drop column if exists descripcion;
alter table partes drop column if exists materiales;
alter table partes drop column if exists firma_url;

-- `create table if not exists partes` above is a no-op on a database that
-- already had the table (which is the case for every environment this app has
-- run in so far), so mes/ano being NOT NULL and the anti-duplicate unique
-- constraint declared in that block never actually reached those databases.
-- Backfill and enforce them explicitly here so this is safe to (re-)run
-- regardless of how old the target database is.
update partes p
set
  mes = coalesce(p.mes, extract(month from r.fecha)::int),
  ano = coalesce(p.ano, extract(year from r.fecha)::int)
from (
  select distinct on (parte_id) parte_id, fecha
  from registros_parte
  order by parte_id, fecha
) r
where r.parte_id = p.id and (p.mes is null or p.ano is null);

-- Merge any partes that ended up duplicated for the same
-- trabajador+cliente+mes/ano (possible before the unique constraint below was
-- enforced) into the one with the lowest numero_parte, moving its registros
-- over first so no work is lost.
do $$
declare
  dup record;
  keep_id uuid;
begin
  for dup in
    select trabajador_id, cliente_id, mes, ano
    from partes
    where mes is not null and ano is not null
    group by trabajador_id, cliente_id, mes, ano
    having count(*) > 1
  loop
    select id into keep_id from partes
      where trabajador_id = dup.trabajador_id and cliente_id = dup.cliente_id
        and mes = dup.mes and ano = dup.ano
      order by numero_parte asc
      limit 1;

    update registros_parte set parte_id = keep_id
      where parte_id in (
        select id from partes
        where trabajador_id = dup.trabajador_id and cliente_id = dup.cliente_id
          and mes = dup.mes and ano = dup.ano and id <> keep_id
      );

    delete from partes
      where trabajador_id = dup.trabajador_id and cliente_id = dup.cliente_id
        and mes = dup.mes and ano = dup.ano and id <> keep_id;
  end loop;
end $$;

do $$
begin
  if not exists (select 1 from partes where mes is null or ano is null) then
    alter table partes alter column mes set not null;
    alter table partes alter column ano set not null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'partes_trabajador_id_cliente_id_mes_ano_key'
  ) then
    alter table partes
      add constraint partes_trabajador_id_cliente_id_mes_ano_key
      unique (trabajador_id, cliente_id, mes, ano);
  end if;
end $$;

-- Superseded by the unique(trabajador_id, cliente_id, mes, ano) constraint on
-- `partes` itself plus an atomic `insert ... on conflict do nothing` upsert.
drop table if exists parte_ref_trabajador_cliente_mes;

-- The foto/firma feature was removed; this table is no longer written to.
drop table if exists fotosparte;

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
alter table registros_parte enable row level security;
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
drop policy if exists "Allow trabajadores reopen own partes" on partes;
drop policy if exists "Allow administrador manage all partes" on partes;
drop policy if exists "Allow trabajador read own registros" on registros_parte;
drop policy if exists "Allow trabajador insert own registros if pending" on registros_parte;
drop policy if exists "Allow trabajador update own registros if pending" on registros_parte;
drop policy if exists "Allow trabajador insert own registros" on registros_parte;
drop policy if exists "Allow trabajador update own registros" on registros_parte;
drop policy if exists "Allow administrador manage all registros" on registros_parte;
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

-- Only insert is needed for trabajadores: the header (numero_parte, estado) is
-- created once via `insert ... on conflict do nothing` and never edited by them
-- afterwards; day-to-day edits happen on `registros_parte` instead.
create policy "Allow trabajadores insert partes" on partes
  for insert with check (
    auth.uid() = trabajador_id
  );

-- Lets a trabajador reopen (estado back to 'pendiente') their own parte when
-- they add or edit a registro after an administrador had marked it revisado.
create policy "Allow trabajadores reopen own partes" on partes
  for update using (
    auth.uid() = trabajador_id
  ) with check (
    auth.uid() = trabajador_id
  );

create policy "Allow administrador manage all partes" on partes
  for all using (
    exists (
      select 1 from users where users.id = auth.uid() and users.rol = 'administrador'
    )
  );

create policy "Allow trabajador read own registros" on registros_parte
  for select using (
    exists (
      select 1 from partes
      where partes.id = registros_parte.parte_id
        and (partes.trabajador_id = auth.uid() or public.is_administrador())
    )
  );

-- Not gated on estado = 'pendiente': adding/editing a registro on a
-- previously-revisado parte is allowed and reopens it (see actions/partes.ts),
-- rather than being blocked outright.
create policy "Allow trabajador insert own registros" on registros_parte
  for insert with check (
    exists (
      select 1 from partes
      where partes.id = registros_parte.parte_id
        and partes.trabajador_id = auth.uid()
    )
  );

create policy "Allow trabajador update own registros" on registros_parte
  for update using (
    exists (
      select 1 from partes
      where partes.id = registros_parte.parte_id
        and partes.trabajador_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from partes
      where partes.id = registros_parte.parte_id
        and partes.trabajador_id = auth.uid()
    )
  );

create policy "Allow administrador manage all registros" on registros_parte
  for all using (public.is_administrador());

create policy "Allow trabajador read own avisos" on avisos
  for select using (trabajador_id = auth.uid());

create policy "Allow trabajador resolve own avisos" on avisos
  for update using (trabajador_id = auth.uid())
  with check (trabajador_id = auth.uid());

create policy "Allow administrador manage avisos" on avisos
  for all using (public.is_administrador())
  with check (public.is_administrador());

-- Storage: the 'partes' bucket (avatars/ path) is created via the Supabase
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
