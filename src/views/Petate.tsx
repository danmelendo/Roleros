import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { miPetate } from "../lib/api";
import { oro } from "../lib/formato";
import { nubeConfigurada } from "../lib/supabase";

export function Petate() {
  const { jugadorId } = useParams({ from: "/j/$jugadorId" });
  const petate = useQuery({
    queryKey: ["petate", jugadorId],
    queryFn: () => miPetate(jugadorId),
    enabled: nubeConfigurada,
    refetchInterval: 60_000,
  });

  if (!petate.data) return <p className="tenue-claro">{petate.error?.message ?? "Cargando…"}</p>;
  const { items } = petate.data;

  return (
    <section className="pagina">
      <h2>Petate</h2>
      <p className="bolsa">
        <span className="bolsa-oro">{oro(petate.data.oro)}</span>
      </p>
      {items.length === 0 ? (
        <p className="hueco">No llevas nada más encima.</p>
      ) : (
        <ul className="entradas">
          {items.map((it) => (
            <li key={it.id}>
              <span className="entrada-nombre">{it.item}</span>
              {it.cantidad > 1 && <span className="cifra tenue-inline"> ×{it.cantidad}</span>}
              {it.notas && <p className="entrada-texto">{it.notas}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
