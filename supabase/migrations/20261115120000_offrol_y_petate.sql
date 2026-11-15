-- =============================================================================
-- Roleros · acciones fuera de sesión y petate (oro + inventario)
--
--   · El jugador crea, lista y retira sus acciones por RPC (como el cuestionario).
--   · El máster las responde con resolver_accion(), que en la MISMA transacción
--     mueve el oro y mete objetos en el inventario: no hay forma de dejarlo a medias.
--   · El jugador ve su petate con get_mi_petate(): oro + objetos visibles.
--
-- Idempotente.
-- =============================================================================

alter table public.jugadores       add column if not exists oro numeric(12, 2) not null default 0;
alter table public.acciones_offrol add column if not exists oro_delta numeric(12, 2);
alter table public.acciones_offrol add column if not exists objetos jsonb not null default '[]'::jsonb;

create index if not exists acciones_por_estado  on public.acciones_offrol (estado, created_at);
create index if not exists acciones_por_jugador on public.acciones_offrol (jugador_id, created_at desc);
create index if not exists inventario_jugador   on public.inventario (jugador_id);

-- ----------------------------------------------------------- jugador -------

create or replace function public.crear_accion(p_jugador text, p_tipo text, p_texto text)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  txt   text := btrim(coalesce(p_texto, ''));
  nuevo bigint;
begin
  if not exists (select 1 from public.jugadores where id = p_jugador and activo) then
    raise exception 'Jugador desconocido';
  end if;
  if p_tipo not in ('compra', 'entrenar', 'investigar', 'carta_pnj', 'otro') then
    raise exception 'Tipo de acción desconocido';
  end if;
  if char_length(txt) not between 1 and 2000 then
    raise exception 'Cuéntalo en menos de 2000 caracteres';
  end if;
  if (select count(*) from public.acciones_offrol where jugador_id = p_jugador and estado = 'pendiente') >= 10 then
    raise exception 'Ya tienes 10 acciones pendientes: espera a que el máster conteste';
  end if;

  insert into public.acciones_offrol (jugador_id, tipo, texto)
  values (p_jugador, p_tipo, txt)
  returning id into nuevo;
  return nuevo;
end;
$$;

-- Solo mientras esté pendiente: lo ya respondido es historia.
create or replace function public.retirar_accion(p_jugador text, p_id bigint)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.acciones_offrol
  where id = p_id and jugador_id = p_jugador and estado = 'pendiente';
  if not found then
    raise exception 'Esa acción ya no se puede retirar';
  end if;
end;
$$;

create or replace function public.get_mis_acciones(p_jugador text)
returns table (
  id bigint, tipo text, texto text, estado text, respuesta_dm text,
  oro_delta numeric, objetos jsonb, created_at timestamptz, resuelta_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select a.id, a.tipo, a.texto, a.estado, a.respuesta_dm, a.oro_delta, a.objetos, a.created_at, a.resuelta_at
  from public.acciones_offrol a
  join public.jugadores j on j.id = a.jugador_id and j.activo
  where a.jugador_id = p_jugador
  order by a.created_at desc
  limit 50;
$$;

-- Oro + objetos VISIBLES. Lo marcado como oculto se queda tras el biombo.
create or replace function public.get_mi_petate(p_jugador text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'oro', j.oro,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('id', i.id, 'item', i.item, 'cantidad', i.cantidad, 'notas', i.notas) order by i.item)
      from public.inventario i
      where i.jugador_id = j.id and i.visible
    ), '[]'::jsonb)
  )
  from public.jugadores j
  where j.id = p_jugador and j.activo;
$$;

-- ------------------------------------------------------------ máster -------

-- p_objetos: [{ "item": "Espada corta", "cantidad": 1, "notas": "" }, ...]
create or replace function public.resolver_accion(
  p_id bigint, p_estado text, p_respuesta text,
  p_oro numeric default 0, p_objetos jsonb default '[]'::jsonb
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  a      public.acciones_offrol;
  o      jsonb;
  limpio jsonb := '[]'::jsonb;
  saldo  numeric;
begin
  if not public.es_master() then
    raise exception 'Solo el máster puede responder acciones';
  end if;
  if p_estado not in ('resuelta', 'rechazada') then
    raise exception 'Estado no válido';
  end if;

  select * into a from public.acciones_offrol where id = p_id for update;
  if not found then
    raise exception 'Acción desconocida';
  end if;
  if a.estado <> 'pendiente' then
    raise exception 'Esa acción ya estaba respondida';
  end if;

  if p_estado = 'resuelta' then
    if coalesce(p_oro, 0) <> 0 then
      select oro into saldo from public.jugadores where id = a.jugador_id for update;
      if saldo + p_oro < 0 then
        raise exception 'No le llega el oro: tiene % po', saldo;
      end if;
      update public.jugadores set oro = oro + p_oro where id = a.jugador_id;
    end if;

    for o in select * from jsonb_array_elements(coalesce(p_objetos, '[]'::jsonb)) loop
      continue when btrim(coalesce(o ->> 'item', '')) = '';
      insert into public.inventario (jugador_id, item, cantidad, notas, visible)
      values (a.jugador_id, btrim(o ->> 'item'), greatest(coalesce((o ->> 'cantidad')::int, 1), 1),
              nullif(btrim(coalesce(o ->> 'notas', '')), ''), true);
      limpio := limpio || jsonb_build_array(jsonb_build_object(
        'item', btrim(o ->> 'item'), 'cantidad', greatest(coalesce((o ->> 'cantidad')::int, 1), 1)));
    end loop;
  end if;

  update public.acciones_offrol set
    estado       = p_estado,
    respuesta_dm = nullif(btrim(coalesce(p_respuesta, '')), ''),
    oro_delta    = case when p_estado = 'resuelta' then nullif(p_oro, 0) end,
    objetos      = limpio,
    resuelta_at  = now()
  where id = p_id;
end;
$$;

-- --------------------------------------------------------------- permisos --
revoke execute on function public.crear_accion(text, text, text)                        from public;
revoke execute on function public.retirar_accion(text, bigint)                          from public;
revoke execute on function public.get_mis_acciones(text)                                from public;
revoke execute on function public.get_mi_petate(text)                                   from public;
revoke execute on function public.resolver_accion(bigint, text, text, numeric, jsonb)   from public;

grant execute on function public.crear_accion(text, text, text)                        to anon, authenticated;
grant execute on function public.retirar_accion(text, bigint)                          to anon, authenticated;
grant execute on function public.get_mis_acciones(text)                                to anon, authenticated;
grant execute on function public.get_mi_petate(text)                                   to anon, authenticated;
grant execute on function public.resolver_accion(bigint, text, text, numeric, jsonb)   to authenticated;
