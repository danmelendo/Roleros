import { createHashHistory, createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { Inicio } from "./views/Inicio";
import { Ficha } from "./views/Ficha";
import { Cuestionario } from "./views/Cuestionario";
import { Master } from "./views/Master";
import { MasterJugador } from "./views/MasterJugador";
import { nubeConfigurada } from "./lib/supabase";

function Layout() {
  return (
    <div className="shell">
      {!nubeConfigurada && (
        <p className="aviso">Sin conexión configurada: falta el <code>.env</code> con Supabase.</p>
      )}
      <Outlet />
    </div>
  );
}

const raiz = createRootRoute({ component: Layout });

const rutas = [
  createRoute({ getParentRoute: () => raiz, path: "/", component: Inicio }),
  createRoute({ getParentRoute: () => raiz, path: "/j/$jugadorId", component: Ficha }),
  createRoute({ getParentRoute: () => raiz, path: "/j/$jugadorId/cuestionario", component: Cuestionario }),
  createRoute({ getParentRoute: () => raiz, path: "/master", component: Master }),
  createRoute({ getParentRoute: () => raiz, path: "/master/$jugadorId", component: MasterJugador }),
];

/* Hash (#/ruta): funciona igual en file:// (APK) y en GitHub Pages (/Roleros/). */
export const router = createRouter({
  routeTree: raiz.addChildren(rutas),
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
