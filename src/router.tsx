import { createHashHistory, createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { Inicio } from "./views/Inicio";
import { Instalar } from "./views/Instalar";
import { JugadorLayout } from "./views/Jugador";
import { Ficha } from "./views/Ficha";
import { Petate } from "./views/Petate";
import { Acciones } from "./views/Acciones";
import { Cuestionario } from "./views/Cuestionario";
import { Diario } from "./views/Diario";
import { Master } from "./views/Master";
import { MasterAcciones } from "./views/MasterAcciones";
import { MasterJugador } from "./views/MasterJugador";
import { MasterCombate } from "./views/MasterCombate";
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

// Jugador: cabecera y pestañas comunes (JugadorLayout) y cada sección dentro.
const jugador = createRoute({ getParentRoute: () => raiz, path: "/j/$jugadorId", component: JugadorLayout });
const deJugador = [
  createRoute({ getParentRoute: () => jugador, path: "/", component: Ficha }),
  createRoute({ getParentRoute: () => jugador, path: "petate", component: Petate }),
  createRoute({ getParentRoute: () => jugador, path: "acciones", component: Acciones }),
  createRoute({ getParentRoute: () => jugador, path: "diario", component: Diario }),
  createRoute({ getParentRoute: () => jugador, path: "cuestionario", component: Cuestionario }),
];

const rutas = [
  createRoute({ getParentRoute: () => raiz, path: "/", component: Inicio }),
  createRoute({ getParentRoute: () => raiz, path: "/instalar", component: Instalar }),
  jugador.addChildren(deJugador),
  createRoute({ getParentRoute: () => raiz, path: "/master", component: Master }),
  // Estáticas: ganan a /master/$jugadorId.
  createRoute({ getParentRoute: () => raiz, path: "/master/acciones", component: MasterAcciones }),
  createRoute({ getParentRoute: () => raiz, path: "/master/combate", component: MasterCombate }),
  createRoute({ getParentRoute: () => raiz, path: "/master/$jugadorId", component: MasterJugador }),
];

/* Hash (#/ruta): funciona igual en GitHub Pages (/Roleros/) sin reescrituras del servidor. */
export const router = createRouter({
  routeTree: raiz.addChildren(rutas),
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
