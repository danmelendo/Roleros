import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { avisoCerrado, cerrarAviso, esMovil, instalada } from "../lib/instalar";

/** En el móvil, mientras no la tenga instalada: enlace a la guía. Se puede cerrar. */
export function AvisoInstalar() {
  const [visible, setVisible] = useState(() => esMovil && !instalada() && !avisoCerrado());
  if (!visible) return null;
  return (
    <div className="pagina aviso-instalar">
      <Link to="/instalar" className="aviso-instalar-texto">
        Ponla en tu pantalla de inicio <span className="enlace">Ver cómo →</span>
      </Link>
      <button
        type="button"
        className="quitar"
        title="No volver a mostrar"
        onClick={() => { cerrarAviso(); setVisible(false); }}
      >
        ×
      </button>
    </div>
  );
}
