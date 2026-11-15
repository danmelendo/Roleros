-- =============================================================================
-- Roleros · ficha asignada, retrato y diario
--
--   · fichas.asignada: el máster marca la ficha como terminada. Hasta entonces
--     (y mientras el jugador no acabe el cuestionario) get_ficha_revelada()
--     devuelve NULL: el jugador no ve nada de la ficha, ni siquiera los PG.
--   · retratos: una imagen por jugador, guardada como data URL (el cliente la
--     reduce antes de subirla). Se escribe solo con poner_retrato().
--   · diario: notas libres del jugador. Lee y escribe solo por RPC.
--
-- Idempotente.
-- =============================================================================

alter table public.fichas add column if not exists asignada boolean not null default false;

-- ------------------------------------------------ ficha revelada (con puerta) --
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
  -- Cuestionario a medias: todavía no hay ficha que ver.
  if exists (
    select 1 from public.cuestionario_preg q
    where q.activa
      and not exists (select 1 from public.cuestionario_resp c where c.jugador_id = p_jugador and c.pregunta_id = q.id)
  ) then
    return null;
  end if;

  select datos into d from public.fichas where jugador_id = p_jugador and asignada;
  if d is null then
    return null;
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

-- ----------------------------------------------------------------- retrato ---
create table if not exists public.retratos (
  jugador_id text primary key references public.jugadores (id) on delete cascade,
  imagen     text not null check (char_length(imagen) <= 400000 and imagen ~ '^data:image/(jpeg|png|webp);base64,'),
  updated_at timestamptz not null default now()
);
alter table public.retratos enable row level security;

create or replace function public.get_retrato(p_jugador text)
returns text
language sql stable security definer set search_path = public
as $$
  select r.imagen
  from public.retratos r
  join public.jugadores j on j.id = r.jugador_id and j.activo
  where r.jugador_id = p_jugador;
$$;

-- p_imagen vacía o null: quita el retrato.
create or replace function public.poner_retrato(p_jugador text, p_imagen text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.jugadores where id = p_jugador and activo) then
    raise exception 'Jugador desconocido';
  end if;
  if coalesce(p_imagen, '') = '' then
    delete from public.retratos where jugador_id = p_jugador;
    return;
  end if;
  if p_imagen !~ '^data:image/(jpeg|png|webp);base64,' then
    raise exception 'Eso no es una imagen';
  end if;
  if char_length(p_imagen) > 400000 then
    raise exception 'La imagen es demasiado grande';
  end if;
  insert into public.retratos (jugador_id, imagen) values (p_jugador, p_imagen)
  on conflict (jugador_id) do update set imagen = excluded.imagen, updated_at = now();
end;
$$;

-- ------------------------------------------------------------------ diario ---
create table if not exists public.diario (
  id         bigserial primary key,
  jugador_id text not null references public.jugadores (id) on delete cascade,
  texto      text not null check (char_length(texto) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.diario enable row level security;
create index if not exists diario_por_jugador on public.diario (jugador_id, created_at desc);

create or replace function public.get_mi_diario(p_jugador text)
returns table (id bigint, texto text, created_at timestamptz, updated_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select d.id, d.texto, d.created_at, d.updated_at
  from public.diario d
  join public.jugadores j on j.id = d.jugador_id and j.activo
  where d.jugador_id = p_jugador
  order by d.created_at desc
  limit 300;
$$;

-- p_id null: entrada nueva. Con p_id: la edita (solo si es del mismo jugador).
create or replace function public.escribir_diario(p_jugador text, p_id bigint, p_texto text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  txt text := btrim(coalesce(p_texto, ''));
begin
  if not exists (select 1 from public.jugadores where id = p_jugador and activo) then
    raise exception 'Jugador desconocido';
  end if;
  if char_length(txt) not between 1 and 5000 then
    raise exception 'La entrada tiene que tener entre 1 y 5000 caracteres';
  end if;

  if p_id is null then
    if (select count(*) from public.diario where jugador_id = p_jugador) >= 300 then
      raise exception 'El diario está lleno (300 entradas): borra alguna';
    end if;
    insert into public.diario (jugador_id, texto) values (p_jugador, txt);
  else
    update public.diario set texto = txt, updated_at = now()
    where id = p_id and jugador_id = p_jugador;
    if not found then
      raise exception 'Esa entrada ya no existe';
    end if;
  end if;
end;
$$;

create or replace function public.borrar_diario(p_jugador text, p_id bigint)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.diario where id = p_id and jugador_id = p_jugador;
end;
$$;

-- --------------------------------------------------------------- políticas --
do $$
declare t text;
begin
  foreach t in array array['retratos', 'diario'] loop
    execute format('drop policy if exists "master todo" on public.%I', t);
    execute format('create policy "master todo" on public.%I for all to authenticated
                    using (public.es_master()) with check (public.es_master())', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- permisos --
revoke execute on function public.get_retrato(text)                      from public;
revoke execute on function public.poner_retrato(text, text)              from public;
revoke execute on function public.get_mi_diario(text)                    from public;
revoke execute on function public.escribir_diario(text, bigint, text)    from public;
revoke execute on function public.borrar_diario(text, bigint)            from public;

grant execute on function public.get_retrato(text)                      to anon, authenticated;
grant execute on function public.poner_retrato(text, text)              to anon, authenticated;
grant execute on function public.get_mi_diario(text)                    to anon, authenticated;
grant execute on function public.escribir_diario(text, bigint, text)    to anon, authenticated;
grant execute on function public.borrar_diario(text, bigint)            to anon, authenticated;
