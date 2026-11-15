/* Quién es este móvil. Los jugadores no tienen cuenta: eligen nombre y se
   recuerda aquí. Aceptado: alguien podría elegir otro nombre y ver lo
   revelado de otro; lo oculto sigue protegido en el servidor. */
const CLAVE = "roleros:jugador";

export function jugadorGuardado(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

export function guardarJugador(id: string | null) {
  try {
    if (id) localStorage.setItem(CLAVE, id);
    else localStorage.removeItem(CLAVE);
  } catch {
    /* modo privado: se elige cada vez */
  }
}
