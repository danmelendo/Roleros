-- Bestiario de la campaña para la mesa de combate del biombo: bloques de
-- estadísticas de enemigos y PNJ, en texto. Es material de máster: solo el
-- máster lo lee y lo escribe (sin políticas para anon). Los datos se cargan
-- desde fuera del repo; aquí solo va la tabla.
--
-- Formato de `bloque`: una línea por renglón, la primera «Nombre VD x».
-- **negrita** y *cursiva* marcan el texto para leerlo en la mesa; las líneas
-- que son solo «Defensa», «Ataque», «Tácticas»… son separadores.

create table if not exists public.bestiario (
  id         text primary key check (id ~ '^[a-z0-9-]{1,80}$'),
  orden      int  not null default 0,
  grupo      text not null default '',
  nombre     text not null check (char_length(nombre) between 1 and 120),
  vd         text,
  cuantos    int  not null default 1 check (cuantos between 1 and 30),
  bando      text not null default 'enemigo' check (bando in ('enemigo', 'aliado', 'companero')),
  bloque     text not null check (char_length(bloque) <= 20000),
  updated_at timestamptz not null default now()
);
alter table public.bestiario enable row level security;

drop policy if exists "master todo" on public.bestiario;
create policy "master todo" on public.bestiario for all to authenticated
  using (public.es_master()) with check (public.es_master());

revoke all on public.bestiario from anon;
