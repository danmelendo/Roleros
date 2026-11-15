import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { esMaster } from "./api";
import { nubeConfigurada, supabase } from "./supabase";

/** Sesión del máster. `undefined` = todavía leyendo del disco (no pintes el login aún). */
export function useSesion() {
  const [sesion, setSesion] = useState<Session | null | undefined>(nubeConfigurada ? undefined : null);

  useEffect(() => {
    if (!nubeConfigurada) return;
    supabase.auth.getSession().then(({ data }) => setSesion(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // Tener sesión no basta: hay que estar en la tabla `masters`.
  const master = useQuery({
    queryKey: ["es-master", sesion?.user.id],
    queryFn: esMaster,
    enabled: !!sesion,
  });

  return { sesion, esMaster: master.data === true, comprobando: sesion === undefined || (!!sesion && master.isLoading) };
}
