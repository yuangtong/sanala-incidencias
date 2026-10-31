-- Señala · esquema inicial
-- Regla central: las lecturas pasan por vistas (v_*) que ocultan la identidad
-- del autor anónimo. Las tablas no se leen directamente desde el cliente.

-- ───────────── Tipos ─────────────
create type public.categoria_incidencia as enum
  ('infraestructura','equipos','red_ti','limpieza','seguridad','academico','otro');
create type public.estado_incidencia as enum
  ('nueva','en_revision','en_progreso','resuelta','cerrada','rechazada');
create type public.visibilidad_incidencia as enum ('publica','privada');
create type public.rol_usuario as enum ('estudiante','admin');

-- ───────────── Perfiles ─────────────
create table public.perfiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  email     text not null,
  nombre    text not null default '',
  rol       public.rol_usuario not null default 'estudiante',
  creado_en timestamptz not null default now()
);

-- Correos que reciben rol admin automáticamente al registrarse
create table public.correos_admin (email text primary key);

create function public.manejar_nuevo_usuario()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfiles (id, email, nombre, rol)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'nombre',''), split_part(new.email,'@',1)),
    case when exists (select 1 from public.correos_admin c where lower(c.email) = lower(new.email))
         then 'admin'::public.rol_usuario else 'estudiante'::public.rol_usuario end
  );
  return new;
end $$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();

-- ───────────── Incidencias ─────────────
create table public.incidencias (
  id               uuid primary key default gen_random_uuid(),
  numero           bigint generated always as identity unique,
  titulo           text not null check (char_length(titulo) between 10 and 120),
  descripcion      text not null check (char_length(descripcion) between 30 and 5000),
  categoria        public.categoria_incidencia not null,
  ubicacion        text not null check (char_length(ubicacion) between 2 and 120),
  fecha_ocurrencia date,
  visibilidad      public.visibilidad_incidencia not null default 'publica',
  anonimo          boolean not null default false,
  estado           public.estado_incidencia not null default 'nueva',
  autor_id         uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  creada_en        timestamptz not null default now(),
  actualizada_en   timestamptz not null default now()
);
create index on public.incidencias (autor_id);
create index on public.incidencias (estado);

create table public.adjuntos (
  id            uuid primary key default gen_random_uuid(),
  incidencia_id uuid not null references public.incidencias(id) on delete cascade,
  ruta          text not null unique,
  nombre        text not null,
  tipo_mime     text not null check (tipo_mime in
                  ('image/jpeg','image/png','image/webp','video/mp4','video/webm')),
  tamano        bigint not null check (tamano > 0 and tamano <= 52428800),
  subido_por    uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  creado_en     timestamptz not null default now()
);
create index on public.adjuntos (incidencia_id);

create table public.comentarios (
  id            uuid primary key default gen_random_uuid(),
  incidencia_id uuid not null references public.incidencias(id) on delete cascade,
  autor_id      uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  cuerpo        text not null check (char_length(cuerpo) between 2 and 3000),
  anonimo       boolean not null default false,
  es_oficial    boolean not null default false,
  oculto        boolean not null default false,
  creado_en     timestamptz not null default now()
);
create index on public.comentarios (incidencia_id);

create table public.votos (
  incidencia_id uuid not null references public.incidencias(id) on delete cascade,
  usuario_id    uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  creado_en     timestamptz not null default now(),
  primary key (incidencia_id, usuario_id)
);

create table public.historial_estados (
  id            uuid primary key default gen_random_uuid(),
  incidencia_id uuid not null references public.incidencias(id) on delete cascade,
  estado_previo public.estado_incidencia,
  estado_nuevo  public.estado_incidencia not null,
  nota          text,
  admin_id      uuid references public.perfiles(id) on delete set null,
  creado_en     timestamptz not null default now()
);
create index on public.historial_estados (incidencia_id);

-- ───────────── Funciones de apoyo ─────────────
create function public.es_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin');
$$;

-- ¿El usuario actual puede ver esta incidencia? (texto para usarla también en Storage)
create function public.puede_ver_incidencia(p_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.incidencias i
    where i.id::text = p_id
      and (i.visibilidad = 'publica' or i.autor_id = auth.uid() or public.es_admin())
  );
$$;

create function public.es_autor_incidencia(p_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.incidencias i where i.id::text = p_id and i.autor_id = auth.uid());
$$;

create function public.es_publica(p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.incidencias i where i.id = p_id and i.visibilidad = 'publica');
$$;

-- Cambio de estado: solo admin, queda registrado en el historial
create function public.cambiar_estado(p_incidencia uuid, p_estado public.estado_incidencia, p_nota text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_previo public.estado_incidencia;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede cambiar el estado';
  end if;
  select estado into v_previo from public.incidencias where id = p_incidencia for update;
  if not found then raise exception 'Incidencia no encontrada'; end if;
  update public.incidencias set estado = p_estado, actualizada_en = now() where id = p_incidencia;
  insert into public.historial_estados (incidencia_id, estado_previo, estado_nuevo, nota, admin_id)
  values (p_incidencia, v_previo, p_estado, nullif(trim(p_nota),''), auth.uid());
end $$;

-- Moderación: solo admin
create function public.ocultar_comentario(p_comentario uuid, p_oculto boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'Solo el administrador puede moderar'; end if;
  update public.comentarios set oculto = p_oculto where id = p_comentario;
end $$;

-- Al crear una incidencia se registra su primer estado
create function public.registrar_estado_inicial()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.historial_estados (incidencia_id, estado_previo, estado_nuevo, nota)
  values (new.id, null, 'nueva', 'Incidencia registrada');
  return new;
end $$;
create trigger al_crear_incidencia
  after insert on public.incidencias
  for each row execute function public.registrar_estado_inicial();

-- ───────────── Seguridad a nivel de fila ─────────────
alter table public.perfiles          enable row level security;
alter table public.correos_admin     enable row level security;
alter table public.incidencias       enable row level security;
alter table public.adjuntos          enable row level security;
alter table public.comentarios       enable row level security;
alter table public.votos             enable row level security;
alter table public.historial_estados enable row level security;

-- Las tablas no se exponen enteras: solo los permisos mínimos
revoke all on public.perfiles, public.correos_admin, public.incidencias, public.adjuntos,
  public.comentarios, public.votos, public.historial_estados from anon, authenticated;

-- perfiles: cada quien lee y edita su nombre; el admin lee todos
grant select, update (nombre) on public.perfiles to authenticated;
create policy perfil_propio_lectura on public.perfiles for select to authenticated
  using (id = auth.uid() or public.es_admin());
create policy perfil_propio_edicion on public.perfiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- incidencias: crear (siempre como uno mismo y en estado "nueva")
grant insert (id, titulo, descripcion, categoria, ubicacion, fecha_ocurrencia, visibilidad, anonimo)
  on public.incidencias to authenticated;
create policy incidencia_crear on public.incidencias for insert to authenticated
  with check (autor_id = auth.uid() and estado = 'nueva');

-- adjuntos: solo el autor de la incidencia
grant insert (incidencia_id, ruta, nombre, tipo_mime, tamano) on public.adjuntos to authenticated;
create policy adjunto_crear on public.adjuntos for insert to authenticated
  with check (subido_por = auth.uid() and public.es_autor_incidencia(incidencia_id::text));

-- comentarios: en públicas cualquiera con sesión; en privadas solo autor y admin.
-- Solo el admin puede publicar la respuesta oficial.
grant insert (incidencia_id, cuerpo, anonimo, es_oficial) on public.comentarios to authenticated;
create policy comentario_crear on public.comentarios for insert to authenticated
  with check (
    autor_id = auth.uid()
    and public.puede_ver_incidencia(incidencia_id::text)
    and (es_oficial = false or public.es_admin())
  );

-- votos: solo en públicas, uno por persona, se puede retirar
grant select (incidencia_id, usuario_id), insert (incidencia_id), delete on public.votos to authenticated;
create policy voto_leer_propio on public.votos for select to authenticated using (usuario_id = auth.uid());
create policy voto_crear on public.votos for insert to authenticated
  with check (usuario_id = auth.uid() and public.es_publica(incidencia_id));
create policy voto_borrar on public.votos for delete to authenticated using (usuario_id = auth.uid());

-- ───────────── Vistas de lectura ─────────────
-- Se ejecutan con permisos del dueño (security definer) y aplican su propio
-- filtro de visibilidad. Así el cliente nunca recibe el autor de una incidencia anónima.
create view public.v_incidencias with (security_barrier = true) as
select
  i.id, i.numero, i.titulo, i.descripcion, i.categoria, i.ubicacion, i.fecha_ocurrencia,
  i.visibilidad, i.anonimo, i.estado, i.creada_en, i.actualizada_en,
  (i.autor_id = auth.uid())                                                   as es_mia,
  case when not i.anonimo or i.autor_id = auth.uid() or public.es_admin()
       then p.nombre end                                                      as autor_nombre,
  case when public.es_admin() then p.email end                                as autor_email,
  (select count(*) from public.votos v where v.incidencia_id = i.id)::int     as votos,
  exists (select 1 from public.votos v
          where v.incidencia_id = i.id and v.usuario_id = auth.uid())         as votada,
  (select count(*) from public.comentarios c
     where c.incidencia_id = i.id and not c.oculto)::int                      as num_comentarios,
  (select count(*) from public.adjuntos a where a.incidencia_id = i.id)::int  as num_adjuntos,
  exists (select 1 from public.comentarios c
          where c.incidencia_id = i.id and c.es_oficial and not c.oculto)     as tiene_respuesta
from public.incidencias i
join public.perfiles p on p.id = i.autor_id
where i.visibilidad = 'publica' or i.autor_id = auth.uid() or public.es_admin();

create view public.v_comentarios with (security_barrier = true) as
select
  c.id, c.incidencia_id, c.cuerpo, c.anonimo, c.es_oficial, c.oculto, c.creado_en,
  (c.autor_id = auth.uid())                                                   as es_mio,
  case when c.es_oficial then 'Administración'
       when not c.anonimo or c.autor_id = auth.uid() or public.es_admin() then p.nombre
  end                                                                         as autor_nombre,
  case when public.es_admin() then p.email end                                as autor_email,
  (p.rol = 'admin')                                                           as autor_es_admin
from public.comentarios c
join public.incidencias i on i.id = c.incidencia_id
join public.perfiles p on p.id = c.autor_id
where (not c.oculto or public.es_admin())
  and (i.visibilidad = 'publica' or i.autor_id = auth.uid() or public.es_admin());

create view public.v_adjuntos with (security_barrier = true) as
select a.id, a.incidencia_id, a.ruta, a.nombre, a.tipo_mime, a.tamano, a.creado_en
from public.adjuntos a
where public.puede_ver_incidencia(a.incidencia_id::text);

create view public.v_historial with (security_barrier = true) as
select h.id, h.incidencia_id, h.estado_previo, h.estado_nuevo, h.nota, h.creado_en
from public.historial_estados h
where public.puede_ver_incidencia(h.incidencia_id::text);

grant select on public.v_incidencias, public.v_comentarios, public.v_adjuntos, public.v_historial
  to anon, authenticated;

revoke execute on function public.cambiar_estado, public.ocultar_comentario from anon;

-- ───────────── Storage: evidencias ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 52428800,
        array['image/jpeg','image/png','image/webp','video/mp4','video/webm']);

-- Ruta de cada archivo: <id_incidencia>/<archivo>
create policy evidencias_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'evidencias'
              and public.es_autor_incidencia((storage.foldername(name))[1]));

create policy evidencias_leer on storage.objects for select to anon, authenticated
  using (bucket_id = 'evidencias'
         and public.puede_ver_incidencia((storage.foldername(name))[1]));
