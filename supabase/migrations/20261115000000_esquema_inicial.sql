-- =============================================================================
-- Roleros · esquema inicial (MVP)
--
-- Regla de oro: el cliente del JUGADOR nunca recibe la ficha completa.
--   · `fichas` y `ficha_revelado` no tienen NINGUNA política para anon.
--   · El jugador lee solo con get_ficha_revelada(), que monta un JSON con los
--     campos revelados. Ocultarlo en la interfaz no vale: se vería con F12.
--
-- Los jugadores no tienen cuenta (eligen nombre en un desplegable). El máster
-- sí: un usuario de Supabase Auth que además figura en `masters`. Tener sesión
-- NO basta: hay que estar en esa tabla (por si alguien consigue registrarse).
--
-- Idempotente: se puede volver a ejecutar.
-- =============================================================================

-- ---------------------------------------------------------------- máster ----
create table if not exists public.masters (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.masters enable row level security;

create or replace function public.es_master()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.masters where user_id = auth.uid());
$$;

-- ------------------------------------------------------------- jugadores ----
create table if not exists public.jugadores (
  id      text primary key,               -- slug: 'oscar', 'marina', 'meri'
  nombre  text not null,
  color   text,
  orden   int  not null default 0,
  activo  boolean not null default true
);
alter table public.jugadores enable row level security;

insert into public.jugadores (id, nombre, color, orden) values
  ('oscar',  'Óscar',  '#C9A227', 1),
  ('marina', 'Marina', '#7FB3A8', 2),
  ('meri',   'Meri',   '#B5728C', 3)
on conflict (id) do nothing;

-- ---------------------------------------------------------- cuestionario ----
create table if not exists public.cuestionario_preg (
  id       serial primary key,
  orden    int  not null default 0,
  texto    text not null,
  opciones jsonb not null default '[]'::jsonb,  -- ["opción A", ...]; vacío = respuesta libre
  libre    boolean not null default true,       -- con opciones: ¿se admite además texto libre?
  activa   boolean not null default true
);
alter table public.cuestionario_preg enable row level security;

create table if not exists public.cuestionario_resp (
  id          bigserial primary key,
  jugador_id  text not null references public.jugadores (id) on delete cascade,
  pregunta_id int  not null references public.cuestionario_preg (id) on delete cascade,
  respuesta   text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (jugador_id, pregunta_id)          -- se puede cambiar la respuesta
);
alter table public.cuestionario_resp enable row level security;

-- --------------------------------------------------------------- fichas -----
-- La ficha es JSON libre que rellena el máster: NO hay motor de reglas de PF1e.
-- Convención: listas como OBJETOS con clave (dotes: { "soltura-espada": {...} }),
-- nunca arrays, para poder revelar 'dotes.soltura-espada' por separado.
create table if not exists public.fichas (
  jugador_id text primary key references public.jugadores (id) on delete cascade,
  datos      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.fichas enable row level security;

-- Una fila = un campo revelado. Ruta con puntos: 'clase', 'atributos.fue',
-- 'dotes.soltura-espada'. Revelar un padre revela todo lo que cuelga de él.
create table if not exists public.ficha_revelado (
  jugador_id  text not null references public.jugadores (id) on delete cascade,
  campo_path  text not null check (campo_path ~ '^[a-z0-9_-]+(\.[a-z0-9_-]+)*$'),
  revelado_at timestamptz not null default now(),
  primary key (jugador_id, campo_path)
);
alter table public.ficha_revelado enable row level security;

-- ---------------------------------------------------- fase 2 (solo tablas) --
create table if not exists public.cartas (
  id         serial primary key,
  tipo       text not null check (tipo in ('memoria', 'conocimiento')),
  titulo     text not null,
  texto      text not null,
  cd         int,
  imagen_url text
);
alter table public.cartas enable row level security;

create table if not exists public.cartas_jugador (
  carta_id        int  not null references public.cartas (id) on delete cascade,
  jugador_id      text not null references public.jugadores (id) on delete cascade,
  desbloqueada_at timestamptz not null default now(),
  primary key (carta_id, jugador_id)
);
alter table public.cartas_jugador enable row level security;

create table if not exists public.acciones_offrol (
  id           bigserial primary key,
  jugador_id   text not null references public.jugadores (id) on delete cascade,
  tipo         text not null check (tipo in ('compra', 'entrenar', 'investigar', 'carta_pnj', 'otro')),
  texto        text not null check (char_length(texto) between 1 and 2000),
  estado       text not null default 'pendiente' check (estado in ('pendiente', 'resuelta', 'rechazada')),
  respuesta_dm text,
  created_at   timestamptz not null default now(),
  resuelta_at  timestamptz
);
alter table public.acciones_offrol enable row level security;

create table if not exists public.inventario (
  id         bigserial primary key,
  jugador_id text not null references public.jugadores (id) on delete cascade,
  item       text not null,
  cantidad   int  not null default 1,
  notas      text,
  visible    boolean not null default true
);
alter table public.inventario enable row level security;

-- ------------------------------------------------------------- políticas ----
-- Lectura pública mínima: quién juega y qué se pregunta.
drop policy if exists "leer jugadores activos" on public.jugadores;
create policy "leer jugadores activos" on public.jugadores
  for select to anon, authenticated using (activo or public.es_master());

drop policy if exists "leer preguntas activas" on public.cuestionario_preg;
create policy "leer preguntas activas" on public.cuestionario_preg
  for select to anon, authenticated using (activa or public.es_master());

-- El máster lo puede todo en todas las tablas. Nadie más tiene políticas en
-- las tablas privadas: anon solo entra por las funciones de abajo.
do $$
declare t text;
begin
  foreach t in array array['masters', 'jugadores', 'cuestionario_preg', 'cuestionario_resp',
                           'fichas', 'ficha_revelado', 'cartas', 'cartas_jugador',
                           'acciones_offrol', 'inventario']
  loop
    execute format('drop policy if exists "master todo" on public.%I', t);
    execute format('create policy "master todo" on public.%I for all to authenticated
                    using (public.es_master()) with check (public.es_master())', t);
  end loop;
end $$;

-- ------------------------------------------------- funciones del jugador ----

-- La ficha con SOLO lo revelado. Los PG van siempre.
create or replace function public.get_ficha_revelada(p_jugador text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  d jsonb;
  r jsonb := '{}'::jsonb;
  p text[];
  v jsonb;
  i int;
begin
  select datos into d from public.fichas where jugador_id = p_jugador;
  if d is null then
    return r;
  end if;

  for p in
    select string_to_array(campo_path, '.') from public.ficha_revelado where jugador_id = p_jugador
    union all
    select array['pg']
  loop
    v := d #> p;
    continue when v is null;
    -- jsonb_set no crea padres intermedios: se crean a mano.
    for i in 1 .. coalesce(array_length(p, 1), 0) - 1 loop
      if jsonb_typeof(r #> p[1:i]) is distinct from 'object' then
        r := jsonb_set(r, p[1:i], '{}'::jsonb, true);
      end if;
    end loop;
    r := jsonb_set(r, p, v, true);
  end loop;

  return r;
end;
$$;

create or replace function public.get_mis_respuestas(p_jugador text)
returns table (pregunta_id int, respuesta text)
language sql stable security definer set search_path = public
as $$
  select r.pregunta_id, r.respuesta
  from public.cuestionario_resp r
  join public.jugadores j on j.id = r.jugador_id and j.activo
  where r.jugador_id = p_jugador;
$$;

create or replace function public.enviar_respuesta(p_jugador text, p_pregunta int, p_respuesta text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  preg public.cuestionario_preg;
  txt  text := btrim(coalesce(p_respuesta, ''));
begin
  if not exists (select 1 from public.jugadores where id = p_jugador and activo) then
    raise exception 'Jugador desconocido';
  end if;

  select * into preg from public.cuestionario_preg where id = p_pregunta and activa;
  if not found then
    raise exception 'Pregunta desconocida';
  end if;

  if char_length(txt) not between 1 and 2000 then
    raise exception 'La respuesta tiene que tener entre 1 y 2000 caracteres';
  end if;

  if jsonb_array_length(preg.opciones) > 0 and not preg.libre
     and not preg.opciones ? txt then
    raise exception 'Respuesta fuera de las opciones';
  end if;

  insert into public.cuestionario_resp (jugador_id, pregunta_id, respuesta)
  values (p_jugador, p_pregunta, txt)
  on conflict (jugador_id, pregunta_id)
  do update set respuesta = excluded.respuesta, updated_at = now();
end;
$$;

-- --------------------------------------------------------------- permisos ---
revoke execute on function public.get_ficha_revelada(text)            from public;
revoke execute on function public.get_mis_respuestas(text)            from public;
revoke execute on function public.enviar_respuesta(text, int, text)   from public;
revoke execute on function public.es_master()                         from public;

grant execute on function public.get_ficha_revelada(text)            to anon, authenticated;
grant execute on function public.get_mis_respuestas(text)            to anon, authenticated;
grant execute on function public.enviar_respuesta(text, int, text)   to anon, authenticated;
grant execute on function public.es_master()                         to anon, authenticated;
