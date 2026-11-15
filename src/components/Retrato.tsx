import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ponerRetrato, retrato } from "../lib/api";
import { nubeConfigurada } from "../lib/supabase";

/* Las fotos del móvil pesan megas: se reducen aquí (lado mayor 640 px, JPEG)
   y se guardan como data URL. El servidor rechaza más de ~400 KB. */
async function reducir(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, mal) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => mal(new Error("No se pudo abrir la imagen"));
      i.src = url;
    });
    for (const [lado, calidad] of [[640, 0.82], [480, 0.7], [360, 0.6]] as const) {
      const escala = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * escala);
      c.height = Math.round(img.naturalHeight * escala);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      const datos = c.toDataURL("image/jpeg", calidad);
      if (datos.length <= 380_000) return datos;
    }
    throw new Error("La imagen es demasiado grande");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Retrato redondo. Si es editable, tocarlo abre la galería o la cámara. */
export function Retrato({ jugadorId, editable = false, grande = false }: { jugadorId: string; editable?: boolean; grande?: boolean }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const foto = useQuery({ queryKey: ["retrato", jugadorId], queryFn: () => retrato(jugadorId), enabled: nubeConfigurada, staleTime: 5 * 60_000 });
  const subir = useMutation({
    mutationFn: async (f: File) => ponerRetrato(jugadorId, await reducir(f)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retrato", jugadorId] }),
  });

  const clase = `retrato ${grande ? "grande" : ""} ${subir.isPending ? "subiendo" : ""}`;
  const cara = foto.data ? <img src={foto.data} alt="Retrato del personaje" /> : <span className="retrato-vacio">{editable ? "+" : "?"}</span>;

  if (!editable) return <span className={clase}>{cara}</span>;
  return (
    <>
      <button
        type="button"
        className={clase}
        title={foto.data ? "Cambiar el retrato" : "Sube un retrato de tu personaje"}
        disabled={subir.isPending}
        onClick={() => input.current?.click()}
      >
        {cara}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) subir.mutate(f);
        }}
      />
      {subir.error && <p className="error-claro retrato-error">{subir.error.message}</p>}
    </>
  );
}
