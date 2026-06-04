# Spot ClinicApp · v2 · 22 segundos

Versión actualizada con feedback aplicado: branding "ClinicApp", textos sin puntos, kinetic typography, voz humana (tú la grabas), música real de Pixabay.

---

## 1 · Texto a grabar (tu voz)

Lee esto seguido, **con tono cálido y conversacional** — como si le contaras a un colega clínico lo que hace la app. No leas en monótono. Marca pausas donde están los `‖`. Tiempo objetivo: **17–19 segundos**.

> **Tu clínica produce datos cada día.** ‖
> **Pacientes, agenda, ingresos.** ‖
> **Con ClinicApp** ‖ **los controlas en tiempo real.** ‖
> **Encuentra cualquier ficha en segundos** ‖ **y registra pacientes nuevos en menos de un minuto.** ‖
> **Tu clínica, en un solo lugar.** ‖
> **ClinicApp. Solicita una demo hoy.**

### Tips de grabación
- **Móvil bastante bueno**: la app *Grabadora de voz* de Android o *Notas de voz* de iPhone graban en calidad suficiente.
- **Habitación silenciosa**, sin reverb. Un closet con ropa funciona genial (la ropa absorbe eco).
- **Distancia al micrófono**: 15–20 cm, ligeramente al lado (no frontal directo, para evitar pops).
- **Sonríe ligeramente** al hablar — se nota en la voz y la hace más cercana.
- **Energía**: imagina que estás explicando algo emocionante, no leyendo. Sube un poco el tono al final de "tiempo real" y "en un solo lugar".
- **Toma varias** lecturas. Lo más fácil es leerlo 4-5 veces seguidas en la misma grabación y luego elegir la mejor.

### Formato del archivo
- Exporta como **MP3** (o WAV — yo lo convierto luego). Casi todas las apps de notas de voz exportan a MP3 o M4A. Si es M4A, también funciona, solo renómbralo a `.mp3` o cuéntame y ajusto el HTML.
- Nombre exacto: **`voz.mp3`**
- Ubicación: **`/public/music/voz.mp3`** (yo creé la carpeta — está pendiente, te la genero en cuanto avancemos)

---

## 2 · Música de fondo

Te recomiendo cualquiera de estas 4 pistas de Pixabay (todas libres para uso comercial sin atribución). Escúchalas y elige la que más te resuene. Tras descargar:

- Renombra el archivo a **`spot.mp3`**
- Guárdalo en **`/public/music/spot.mp3`**

### Pistas recomendadas

**1 · Inspirational Corporate Background Music (30s)** — *Mejor opción si quieres exactamente 30 segundos y sonido inspiracional/SaaS clásico.*
🔗 https://pixabay.com/music/upbeat-inspirational-corporate-background-music-30sec-257339/

**2 · Corporate Inspiring Upbeat Technology — Search Engine (Short Version)** — *Tech vibe moderno, 1:08. La favorita para SaaS estilo Linear/Vercel.*
🔗 https://pixabay.com/music/upbeat-corporate-inspiring-upbeat-technology-search-engine-short-version-373811/

**3 · Uplifting & Upbeat Technology Corporate** — *Más emocional, perfecta si quieres transmitir "cuidamos tu trabajo" además de eficiencia.*
🔗 https://pixabay.com/music/corporate-uplifting-amp-upbeat-technology-corporate-141352/

**4 · Upbeat Corporate Technology Background (126 bpm)** — *Más rítmica y energética. Si el spot va a vivir en Reels/TikTok, esta tiene más punch.*
🔗 https://pixabay.com/music/corporate-upbeat-corporate-technology-background-126137/

Mi recomendación personal para el tono "profesional pero cálido" que pediste: **opción 2**.

---

## 3 · Cómo se ve la sincronización

Una vez tengas los dos archivos en `/public/music/`:

1. Recarga el spot (`localhost:3000/spot.html` o doble click al archivo de `marketing/spot.html`).
2. Tu voz arranca al pulsar **Reproducir spot**, junto con el primer fade-in del branding.
3. La música suena en loop al 22% de volumen — debajo de tu voz, casi subliminal.
4. Si tu locución dura un poco más o menos que los 22s del spot, dímelo: ajustamos las duraciones de las escenas en el JS (`SCENES` array). En 30 segundos te recompilo el HTML con los tiempos correctos.

---

## 4 · Textos sobreimpresos (lo que aparece en pantalla)

Aplicado el feedback de "sin puntos finales" + kinetic typography. Cada escena muestra:

| Escena | Texto principal | Subtítulo |
|---|---|---|
| 1 · Hook | `ClinicApp` (logo grande gradiente morado-cian) | `Pacientes · Agenda · Ingresos` |
| 2 · Stats | `Todo en tiempo real` | — |
| 3 · Agenda | `Tu agenda viva` | — |
| 4 · Pacientes | `Cualquier ficha` | `en segundos` |
| 5 · Nuevo paciente | `Un nuevo paciente` | `en menos de un minuto` |
| 6 · Ingresos | `Tus ingresos` | `claros, al día` |
| 7 · CTA | `ClinicApp` (con dot morado) + `Tu clínica, en un solo lugar` + pill `Solicita una demo →` | — |

---

## 4.1 · Layouts nativos verticales (9:16 y 1:1)

Las versiones 9:16 (Reels/TikTok) y 1:1 (LinkedIn) ahora tienen layout **nativo**, no bandas negras. Estructura vertical:

```
┌─────────────────────────────┐
│   ClinicApp (gradiente)     │   ← header con halo morado/cian
│   TU CLÍNICA · EN UN SOLO   │
├─────────────────────────────┤
│                             │
│  [ canvas con escena 16:9 ] │   ← el spot real, centrado
│                             │
├─────────────────────────────┤
│                             │
│    "Una agenda viva"        │   ← caption animado (kinetic)
│                             │
│   ┌──────────────────────┐  │
│   │ Solicita una demo →  │   ← pill CTA siempre visible
│   └──────────────────────┘  │
└─────────────────────────────┘
```

El spot detecta el viewport automáticamente: en 16:9 muestra el canvas a full bleed; en 9:16 o 1:1 muestra el frame nativo. No hay que cambiar nada manualmente.

## 5 · Export a MP4 (3 formatos)

Cuando tengas voz + música en `/public/music/` y hayas revisado el spot en el navegador, corre el script de export:

```bash
# Desde la raíz del proyecto, con `npm run dev` corriendo en otra terminal
sudo apt install ffmpeg            # solo la primera vez
npm install --no-save puppeteer    # solo la primera vez
node marketing/export-spot.js
```

Produce 3 archivos en `marketing/output/`:
- `spot-16x9.mp4` — 1920×1080 para landing, YouTube, embed web
- `spot-9x16.mp4` — 1080×1920 para Reels, TikTok, Stories
- `spot-1x1.mp4` — 1080×1080 para LinkedIn, Twitter feed

**Si la sincronización audio/video se desvía**, ajusta `DURATION_MS` arriba en el script (default 22500). Por ejemplo, si tu voz tarda 19 segundos, cámbialo a 19500.

## 5.1 · Cómo está compuesto el spot (escenario `public/spot.html`)

El spot vuelve al enfoque de **escenario compuesto**, igual que la primera versión, pero ahora la pantalla que se ve dentro del marco es **la app real actual** (no una recreación). Toda la composición vive en `public/spot.html`:

- **Fondo gradiente** morado→teal con halo (igual estética que el original).
- **Header**: wordmark `ClinicApp.` (Clinic blanco + App en gradiente azul→cian) + tagline en mayúsculas tracked (`TU CLÍNICA · EN UN SOLO LUGAR`, cambia por escena).
- **Panel enmarcado**: un `<iframe>` mismo-origen que carga la app real (`/dashboard`, `/dashboard/agenda`, …). Se renderiza a tamaño desktop (1280×800 lógico) y se escala para entrar en el marco → se ve la app completa, como en las capturas. Al estar autenticado por la cookie del login, entra directo sin pantalla de acceso.
- **Caption kinético** grande abajo, con la palabra clave en gradiente.
- **CTA final**: pill `Solicita una demo →`.

`export-spot.js` ya no navega ni escribe en la app: solo hace login (deja la cookie), abre `/spot.html` y graba la reproducción en los 3 formatos.

**Para editar copy, tiempos u orden de escenas, se toca el array `SCENES` en `public/spot.html`** (no el script). Cada entrada: `{ dur, route, tagline, cap, title?, cta?, type? }`.

| Escena | Pantalla (route) | Caption | Tagline |
|---|---|---|---|
| 1 · Intro | — (título) | — | Tu clínica · en un solo lugar |
| 2 · Dashboard | `/dashboard` | Todo en **tiempo real** | Tu clínica · en un solo lugar |
| 3 · Agenda | `/dashboard/agenda` | Una **agenda viva** | Agenda · siempre al día |
| 4 · Pacientes | `/dashboard/pacientes` | Cualquier **ficha** · en segundos | Pacientes · a un clic |
| 5 · Nuevo paciente | `/dashboard/pacientes/nuevo` | Un nuevo **paciente** · en menos de un minuto | Registro express |
| 6 · Ingresos | `/dashboard` | Tus **ingresos** · claros, al día | Ingresos · claros y al día |
| 7 · CTA | — (título) | `Solicita una demo →` | Tu clínica, en un solo lugar |

En la escena 5 el form se autocompleta con un efecto de tipeo (RUT, nombre, apellido, teléfono) accediendo al iframe mismo-origen.

## 6 · Iteraciones posibles

- **Ajustar timing por escena**: edita el array `SCENES` en `public/spot.html`. Cada entrada tiene `dur` en ms. La suma debe coincidir con `DURATION_MS - 500` del script de export (los 500ms son fade out de música).
- **Variantes de texto sobreimpreso**: para A/B testing, cambia los `captionHTML` en `public/spot.html`.
- **Versiones verticales con framing dedicado**: las 9:16 y 1:1 actuales tienen bandas negras arriba/abajo. Si quieres versiones donde el contenido llene el viewport vertical, podemos rediseñar el layout — avísame.
