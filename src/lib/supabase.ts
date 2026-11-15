import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL || "";
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/** ¿Está la nube configurada en este build? Sin .env la app arranca igual y lo avisa. */
export const nubeConfigurada = !!(URL && KEY);

export const supabase = createClient(URL || "http://localhost", KEY || "sin-clave", {
  auth: {
    persistSession: true,      // la sesión del máster sobrevive a cerrar la app
    autoRefreshToken: true,
    detectSessionInUrl: false, // no hay enlaces mágicos: hash router + WebView
    storageKey: "roleros:auth",
  },
});
