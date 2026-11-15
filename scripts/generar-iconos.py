"""Iconos provisionales de la PWA y del APK: una R dorada sobre tinta.

    python scripts/generar-iconos.py

Escribe public/pwa/icono-{180,192,512}.png y icono-maskable-512.png.
Sustitúyelos cuando haya arte de verdad (mismo nombre y tamaño).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "public" / "pwa"
FONDO = (15, 13, 18)
ORO = (201, 162, 39)
FUENTES = [r"C:\Windows\Fonts\georgiab.ttf", r"C:\Windows\Fonts\georgia.ttf", "DejaVuSerif-Bold.ttf"]


def fuente(tam: int) -> ImageFont.FreeTypeFont:
    for f in FUENTES:
        try:
            return ImageFont.truetype(f, tam)
        except OSError:
            continue
    return ImageFont.load_default(tam)


def icono(lado: int, margen: float) -> Image.Image:
    """margen: fracción del lado que queda libre (la zona segura de maskable es el 80 %)."""
    esc = 4  # se dibuja grande y se reduce: bordes suaves
    L = lado * esc
    img = Image.new("RGB", (L, L), FONDO)
    d = ImageDraw.Draw(img)
    m = int(L * margen)
    grosor = max(esc, int(L * 0.03))
    d.ellipse([m, m, L - m, L - m], outline=ORO, width=grosor)
    f = fuente(int((L - 2 * m) * 0.62))
    d.text((L / 2, L / 2), "R", font=f, fill=ORO, anchor="mm")
    return img.resize((lado, lado), Image.LANCZOS)


SALIDA.mkdir(parents=True, exist_ok=True)
for lado in (180, 192, 512):
    icono(lado, 0.08).save(SALIDA / f"icono-{lado}.png")
icono(512, 0.18).save(SALIDA / "icono-maskable-512.png")
print("Iconos en", SALIDA)
