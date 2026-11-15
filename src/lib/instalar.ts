import { useSyncExternalStore } from "react";

/* Instalar la web como app. iPhone: solo a mano (Compartir → Añadir a pantalla
   de inicio). Android/Chrome: avisa con beforeinstallprompt y se puede lanzar
   desde un botón. El evento llega pronto: este módulo se importa en main.tsx. */

const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
export const esIOS = /iPhone|iPad|iPod/.test(ua) || (typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const esAndroid = /Android/.test(ua);
export const esMovil = esIOS || esAndroid;

export function instalada(): boolean {
  try {
    return matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
let diferido: EventoInstalar | null = null;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // sin la mini-barra de Chrome: lo ofrece la guía
    diferido = e as EventoInstalar;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    diferido = null;
    avisar();
  });
}

/** true cuando Chrome deja instalar con un botón. */
export function useInstalable(): boolean {
  return useSyncExternalStore(
    (f) => { oyentes.add(f); return () => oyentes.delete(f); },
    () => diferido !== null,
  );
}

export async function instalarYa(): Promise<void> {
  const e = diferido;
  if (!e) return;
  await e.prompt();
  await e.userChoice;
  diferido = null;
  avisar();
}

/* El aviso "añádela a la pantalla de inicio" se puede cerrar. */
const CLAVE = "roleros:aviso-instalar";
export function avisoCerrado(): boolean {
  try { return localStorage.getItem(CLAVE) === "1"; } catch { return false; }
}
export function cerrarAviso() {
  try { localStorage.setItem(CLAVE, "1"); } catch { /* sin almacenamiento */ }
}
