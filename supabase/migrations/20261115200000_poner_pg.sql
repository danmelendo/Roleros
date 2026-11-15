-- Mesa de combate (biombo): apuntar en la ficha los PG con que acaba un PJ.
-- Solo toca datos.pg.actual; el resto del JSON se queda como está, aunque se
-- esté editando la ficha a la vez. Security invoker: pasa por las políticas
-- de `fichas` (solo el máster), y además se comprueba aquí.

create or replace function public.poner_pg(p_jugador text, p_actual integer)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.es_master() then
    raise exception 'solo el máster';
  end if;
  if p_actual is null or p_actual < -1000 or p_actual > 10000 then
    raise exception 'PG fuera de rango';
  end if;
  update public.fichas
     set datos = datos || jsonb_build_object(
           'pg', coalesce(case when jsonb_typeof(datos -> 'pg') = 'object' then datos -> 'pg' end, '{}'::jsonb)
                 || jsonb_build_object('actual', p_actual)),
         updated_at = now()
   where jugador_id = p_jugador;
end;
$$;

revoke all on function public.poner_pg(text, integer) from public, anon;
grant execute on function public.poner_pg(text, integer) to authenticated;
