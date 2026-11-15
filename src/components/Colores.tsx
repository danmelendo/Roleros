/** Colores de jugador: el borde de su tarjeta en el biombo y su botón en la portada. */
export const COLORES = ["#C9A227", "#7FB3A8", "#B5728C", "#8C6BB1", "#6E9F4E", "#C46A3A", "#4F7DB5", "#A8A08A"];

export function Colores({ valor, onCambio }: { valor: string; onCambio: (c: string) => void }) {
  // Un color que no esté en la paleta (puesto a mano en la BD) también se enseña.
  const lista = COLORES.some((c) => c.toLowerCase() === valor.toLowerCase()) || !valor ? COLORES : [valor, ...COLORES];
  return (
    <div className="chips" role="radiogroup" aria-label="Color">
      {lista.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={valor.toLowerCase() === c.toLowerCase()}
          aria-label={`Color ${c}`}
          className={`muestra ${valor.toLowerCase() === c.toLowerCase() ? "activo" : ""}`}
          style={{ background: c }}
          onClick={() => onCambio(c)}
        />
      ))}
    </div>
  );
}
