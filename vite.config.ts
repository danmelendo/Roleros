import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* Igual que RPGym: base relativa. Así el mismo dist/ sirve
   - dentro del WebView de Capacitor (file://), y
   - en GitHub Pages bajo /Roleros/ sin tocar nada.
   Por eso el router usa hash (#/ruta): no depende de la ruta del servidor. */
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "dist", chunkSizeWarningLimit: 1000 }, // un solo bundle a propósito: app pequeña, offline
  server: {
    host: true,         // accesible desde el móvil por la IP de la red local
    allowedHosts: true, // y desde túneles, para probar antes de empaquetar
  },
});
