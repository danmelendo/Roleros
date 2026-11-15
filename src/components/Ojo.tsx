/* Interruptor de revelado. Abierto y dorado = el jugador lo ve.
   "heredada" = lo ve porque se reveló el grupo entero (o son los PG): no se toca aquí. */
type Props = {
  estado: "propia" | "heredada" | false;
  onCambiar: (revelar: boolean) => void;
  ocupado?: boolean;
  que: string;
};

export function Ojo({ estado, onCambiar, ocupado, que }: Props) {
  const visible = estado !== false;
  const titulo =
    estado === "heredada" ? `${que}: visible (por su grupo)` : visible ? `Ocultar ${que}` : `Revelar ${que}`;
  return (
    <button
      type="button"
      className={`ojo ${visible ? "abierto" : ""} ${estado === "heredada" ? "heredado" : ""}`}
      disabled={ocupado || estado === "heredada"}
      onClick={() => onCambiar(!visible)}
      title={titulo}
      aria-label={titulo}
      aria-pressed={visible}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {visible ? (
          <>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        ) : (
          <>
            <path d="M3 3l18 18" />
            <path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </>
        )}
      </svg>
    </button>
  );
}
