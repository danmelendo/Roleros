import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { apuntarPG, pjsParaCombate } from "../lib/api";
import { useSesion } from "../lib/sesion";
import { montarMesa } from "../combate/mesa";

/* Mesa de combate del biombo (portátil). La mesa es una isla imperativa
   (src/combate/mesa.ts) montada en un Shadow DOM; aquí solo va la puerta de
   máster y la conexión con las fichas. Ocupa todo el ancho (.mesa-combate). */
export function MasterCombate() {
  const { sesion, esMaster, comprobando } = useSesion();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!esMaster || !host.current) return;
    return montarMesa(host.current, { cargarPJs: pjsParaCombate, apuntarPG });
  }, [esMaster]);

  if (comprobando) return <main className="pantalla mesa-combate"><p className="tenue-claro">Comprobando…</p></main>;
  if (!sesion || !esMaster) {
    return (
      <main className="pantalla">
        <p className="error-claro">La mesa de combate es del máster.</p>
        <Link to="/master" className="boton">Entrar en el biombo</Link>
      </main>
    );
  }
  return <div className="mesa-combate" ref={host} />;
}
