import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { esAndroid, esIOS, instalada, instalarYa, useInstalable } from "../lib/instalar";

/* Iconos de los botones tal y como se ven en el móvil, para reconocerlos. */
const Svg = ({ children }: { children: ReactNode }) => (
  <svg className="icono-paso" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const Compartir = () => <Svg><path d="M12 15V3M8 7l4-4 4 4" /><path d="M7 10H5v11h14V10h-2" /></Svg>;
const Mas = () => <Svg><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 8v8M8 12h8" /></Svg>;
const Puntos = () => <Svg><circle cx="5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="19" cy="12" r="1.3" /></Svg>;
const Menu = () => <Svg><circle cx="12" cy="5" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="12" cy="19" r="1.3" /></Svg>;

function IPhone() {
  return (
    <section className="pagina">
      <h2>iPhone · Safari</h2>
      <ol className="pasos">
        <li>
          Abre <b>danmelendo.github.io/Roleros</b> en <b>Safari</b>. Si te llegó el enlace por WhatsApp u otra app,
          ábrelo antes en Safari: desde dentro de otras apps no sale la opción.
        </li>
        <li>
          Toca <b>Compartir</b> <Compartir />. Si no lo ves en la barra, toca primero los tres puntos <Puntos /> que
          hay junto a la dirección.
        </li>
        <li>
          Desliza hacia abajo y toca <b>Añadir a pantalla de inicio</b> <Mas />. Si no aparece, toca <b>Ver más</b> al final de la lista.
        </li>
        <li>
          Si sale el interruptor <b>Abrir como app web</b>, déjalo encendido. Toca <b>Añadir</b>.
        </li>
        <li>
          Abre Roleros desde su icono nuevo y elige tu nombre otra vez: la app no comparte memoria con Safari.
          Solo hace falta la primera vez.
        </li>
      </ol>
    </section>
  );
}

function Android() {
  const puede = useInstalable();
  return (
    <section className="pagina">
      <h2>Android · Chrome</h2>
      {puede && (
        <>
          <button className="boton" onClick={() => instalarYa()}>Instalar ahora</button>
          <p className="nota">O, si lo prefieres, a mano:</p>
        </>
      )}
      <ol className="pasos">
        <li>Abre <b>danmelendo.github.io/Roleros</b> en <b>Chrome</b>.</li>
        <li>Toca el menú <Menu /> de arriba a la derecha.</li>
        <li>
          Toca <b>Añadir a pantalla de inicio</b> y luego <b>Instalar</b>. En algunos móviles pone directamente{" "}
          <b>Instalar aplicación</b>.
        </li>
        <li>Abre Roleros desde su icono.</li>
      </ol>
    </section>
  );
}

export function Instalar() {
  const ya = instalada();
  return (
    <main className="pantalla">
      <header className="cabecera">
        <Link to="/" className="enlace-tenue">← Volver</Link>
        <h1>Roleros en el móvil</h1>
        <p className="sub">Con el icono en la pantalla de inicio se abre como una app: a pantalla completa y sin las barras del navegador.</p>
      </header>

      {ya && (
        <section className="pagina">
          <h2>Ya está</h2>
          <p className="tenue">Estás usando Roleros desde su icono. No hace falta nada más.</p>
        </section>
      )}

      {/* Primero los pasos de este móvil. */}
      {esAndroid && !esIOS ? <><Android /><IPhone /></> : <><IPhone /><Android /></>}
    </main>
  );
}
