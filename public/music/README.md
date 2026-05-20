# Audio del spot

Esta carpeta contiene los archivos de audio que carga `/public/spot.html`.

## Archivos que necesita el spot

| Archivo | Qué es | Fuente |
|---|---|---|
| `voz.mp3` | Locución del spot (tu voz) | Grabar con móvil siguiendo `/marketing/guion-spot.md` |
| `spot.mp3` | Música de fondo instrumental | Descargar 1 pista de las 4 sugeridas en `/marketing/guion-spot.md` |

## Notas
- Si falta alguno de los dos archivos, el spot reproduce igual pero sin ese audio (no rompe nada).
- Si Next.js no detecta los archivos recién agregados, reinicia el dev server (`Ctrl+C` y `npm run dev`).
- Formato preferido: MP3. Si tu locución sale como M4A o WAV, también sirve — solo cambia la extensión en el archivo o avísame y ajusto el HTML.
