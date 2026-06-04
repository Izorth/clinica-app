# Design System — clinica-app

## Contexto del producto
- **Qué es:** SaaS de gestión clínica para Chile — agenda, pacientes, médicos, pagos.
- **Para quién:** Recepcionistas, médicos y administradores de clínicas.
- **Espacio:** Gestión clínica / HealthTech B2B local. Competencia: Doctoralia (marketplace), Jane App, SimplePractice.
- **Tipo de proyecto:** Web app de gestión (no marketing site) — los usuarios pasan 8+ horas al día usando esto.
- **Memorable-thing:** "Software serio para clínicas serias" — cada decisión de diseño sirve este eje.

---

## Dirección estética
- **Dirección:** Industrial/Utilitarian elevado — la precisión limpia de un instrumento bien hecho.
- **Nivel de decoración:** Minimal — la tipografía y el espacio hacen todo el trabajo.
- **Mood:** Confianza sin frialdad. No el blanco estéril de hospital, sino la seguridad tranquila de una herramienta de trabajo que dura años.
- **Referencias visuales:** Stripe Dashboard, Linear, Loom (interfaces de trabajo precisas y sin adornos).
- **Anti-referencia:** Evitar el look de SaaS genérico bootstrapped (grises zinc, bordes redondeados exagerados, iconos en círculos de colores, gradientes como CTA).

---

## Tipografía

| Rol | Fuente | Carga |
|-----|--------|-------|
| Display / Números grandes | **Instrument Serif** | `next/font/google` |
| UI / Cuerpo / Tablas | **DM Sans** | `next/font/google` |
| Datos técnicos (RUT, montos, horas, IDs) | **Geist Mono** | Ya cargado por defecto |

**Rationale:**
- **Instrument Serif** para stats del dashboard (247 pacientes, $1.840.000) y nombres de pacientes en fichas individuales. Ninguna app clínica del mercado usa serif — da gravitas real y differenciación inmediata en demos.
- **DM Sans** es más limpio que Geist, levemente más humano, excelente a 13–14px en tablas densas.
- **Geist Mono** para RUTs, teléfonos, montos, timestamps — técnico donde corresponde.

**Fuentes prohibidas:** Inter, Roboto, Arial, Helvetica, Open Sans, Poppins, Space Grotesk como fuente principal. Solo usar si el cliente lo requiere explícitamente.

### Escala tipográfica

| Nivel | Valor | Fuente | Uso |
|-------|-------|--------|-----|
| stat-display | 32–42px | Instrument Serif | Números grandes en dashboard |
| heading-page | 15px / 600 | DM Sans | Título de página en topbar |
| heading-section | 13px / 600 | DM Sans | Título de card, sección |
| body | 14px / 400 | DM Sans | Contenido general |
| label | 11px / 700 / uppercase / tracking-widest | DM Sans | Etiquetas de tabla, metadatos |
| data | 12–13px / 400 | Geist Mono | RUT, hora, monto, ID |
| small | 11–12px / 400 | DM Sans | Metadata secundaria |

---

## Color

### Arquitectura white-label HSL

La paleta de brand se genera desde 3 variables CSS. Para adaptar la app a un cliente, solo se modifica este bloque — todos los componentes (botones, badges completada, focus rings, fondos sutiles) se adaptan automáticamente.

```css
:root {
  --brand-h: 221;          /* Hue del color de marca */
  --brand-s: 83%;          /* Saturación */
  --brand-l: 53%;          /* Luminosidad */

  /* Derivados — no tocar por cliente */
  --color-brand:         hsl(var(--brand-h) var(--brand-s) var(--brand-l));
  --color-brand-hover:   hsl(var(--brand-h) var(--brand-s) calc(var(--brand-l) - 8%));
  --color-brand-subtle:  hsl(var(--brand-h) 40% 96%);
  --color-brand-muted:   hsl(var(--brand-h) 35% 88%);
  --color-brand-border:  hsl(var(--brand-h) 40% 80%);
}
```

**Default (azul profesional):** `--brand-h: 221; --brand-s: 83%; --brand-l: 53%;` → `#2563EB`

**Ejemplos de retheme por cliente:**
- Verde esmeralda: `160 / 84% / 39%`
- Violeta institucional: `262 / 83% / 58%`
- Rojo corporativo: `0 / 72% / 51%`

### Neutrales — Stone (calido) en vez de Zinc (frío)

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg` | `#FAFAF9` (stone-50) | Fondo de página |
| `--surface` | `#FFFFFF` | Cards, sidebar, inputs |
| `--surface-2` | `#F5F4F2` (stone-100) | Fondos de tabla th, hover secundario |
| `--border` | `#E7E5E0` (stone-200) | Bordes generales |
| `--border-strong` | `#C7C3BB` (stone-300) | Bordes de inputs |
| `--text` | `#1C1917` (stone-900) | Texto principal |
| `--text-muted` | `#78716C` (stone-500) | Texto secundario, doctores, meta |
| `--text-subtle` | `#A8A29E` (stone-400) | Etiquetas, placeholders |

**Por qué Stone y no Zinc:** El zinc actual se lee como interfaz de IT gubernamental. Stone es calido, da sensación de clínica que cuida a la gente. La diferencia es sutil pero acumulada en 8 horas de uso se siente.

### Semánticos (no cambiar por cliente)

| Estado | Color | Subtle bg | Border |
|--------|-------|-----------|--------|
| Success / Confirmada | `#10B981` | `#ECFDF5` | `#6EE7B7` |
| Warning / Pendiente | `#D97706` | `#FFFBEB` | `#FCD34D` |
| Danger / Cancelada | `#DC2626` | `#FEF2F2` | `#FCA5A5` |
| Info | `#2563EB` | `#EFF6FF` | `#93C5FD` |

### Modo oscuro

Invertir superficies: `--bg: #0C0A09`, `--surface: #1C1917`, `--surface-2: #292524`. Reducir saturación del brand 10–15% en dark. Los semánticos mantienen los mismos hues, solo reducir lightness.

---

## Espaciado

- **Base unit:** 8px
- **Densidad:** Media-compacta — es una app de trabajo, no landing page.
- **Escala:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64px

Regla de oro: padding interno de cards → 20–24px. Padding entre secciones → 24–32px. Gap en tablas → 12–16px vertical.

---

## Layout

- **Patrón:** Sidebar vertical izquierda (220px) + área de contenido. Reemplaza el header horizontal actual.
- **Por qué:** El patrón de sidebar libera espacio vertical para contenido denso (tablas, agendas). Es el estándar de apps de gestión maduras (Linear, Notion, Stripe). El header horizontal es estilo marketing site.
- **Max-width contenido:** `max-w-6xl` (actual) — mantener.
- **Grid:** Sidebar fijo + contenido flexible. Responsive: sidebar se oculta en mobile, menú hamburguesa.

---

## Border radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | 4px | Badges, chips pequeños |
| `--radius-md` | 6px | Botones, inputs, cards internas |
| `--radius-lg` | 8px | Cards principales, modales, sidebar items |
| `--radius-full` | 9999px | Badges pill, avatares |

**Importante:** Menos redondeado que el actual shadcn default. Las apps clínicas con border-radius exagerado se ven de juguete. La austeridad aquí refuerza el "software serio".

---

## Movimiento

- **Enfoque:** Minimal-funcional — solo animaciones que ayudan a la comprensión del estado.
- **Framer Motion:** Ya instalado — usar para: skeleton → contenido (fade), modal enter/exit (scale + fade), toast notifications (slide).
- **Sin:** Animaciones decorativas, hover effects complejos, scroll-driven animations.

| Tipo | Duración | Easing |
|------|----------|--------|
| Micro (hover, focus) | 100ms | ease-out |
| Short (skeleton fade) | 200ms | ease-out |
| Medium (modal) | 250ms | ease-in-out |
| Page transition | 300ms | ease-in-out |

---

## Componentes específicos

### Status badges (citas)

Diseño: pill shape (`border-radius: 9999px`) con borde izquierdo de 2px + dot de 5px + fondo sutil. No usar los variants genéricos de shadcn.

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 3px 8px 3px 6px;
  border-radius: 9999px;
  border-left: 2px solid transparent;
}
```

### Stat cards (dashboard)

- Número principal: Instrument Serif 32px
- Etiqueta: DM Sans 11px / 700 / uppercase / letter-spacing widest / color subtle
- Delta: DM Sans 11px / 600 / color semántico

### Tablas

- `th`: 11px / 700 / uppercase / letter-spacing / stone subtle — fondo surface-2
- `td`: 13–14px, padding 12–16px vertical
- Hover de fila: `bg: #FAFAF9` (stone-50) — calido, no zinc
- RUT/teléfono/hora: Geist Mono
- Nombre de paciente: DM Sans 600

### Sidebar navigation

- Ítems inactivos: stone-500, hover → surface-2 + stone-900
- Ítem activo: `background: --color-brand-subtle`, `color: --color-brand`
- Font: DM Sans 13px / 500
- Íconos: 15px, opacidad 0.7 (inactivo), 1 (activo)

---

## Identidad visual — Reglas de neutralidad para white-label

La app no debe mostrar indicios de su proveedor tecnológico. Esto permite venderla a distintos clientes sin que parezca "la app de otro".

**Eliminar y no incluir:**
- Logotipos de Next.js, Vercel, React, o cualquier framework en la UI
- Íconos decorativos de frameworks en páginas de la app (ej. el globe/window/file de la plantilla default de Next.js)
- Links o referencias a proveedores en footer o headers de la interfaz operativa
- Powered by / Built with cualquier tecnología visible al usuario final

**Identidad visible:**
- Solo el logo y nombre del cliente (configurable por tenant/cliente)
- Brand colors del cliente vía los 3 tokens HSL
- Nada más

---

## Decisiones registradas

| Fecha | Decisión | Rationale |
|-------|----------|-----------|
| 2026-06-03 | Instrument Serif como fuente display | Diferenciación en demos — ninguna app clínica del mercado usa serif. Convierte datos en algo que se siente importante. |
| 2026-06-03 | Stone (calido) en vez de Zinc (frío) para neutrales | Zinc se lee como IT gubernamental. Stone refuerza el "clínica que cuida". |
| 2026-06-03 | Arquitectura HSL `--brand-h/s/l` para white-label | Un bloque de 3 variables genera paleta completa coherente (hover, subtle, muted) — sin tocar componentes por cliente. |
| 2026-06-03 | Sidebar vertical izquierda | Estándar de apps de gestión maduras — libera espacio vertical para contenido denso. Header horizontal es patrón de landing page. |
| 2026-06-03 | Border radius 4–6–8px (vs. shadcn default más redondeado) | Austeridad refuerza credibilidad de "software serio". Radio exagerado se ve de juguete. |
| 2026-06-03 | Eliminar logos e iconos de framework de la UI | App white-label — no debe revelar el stack tecnológico al usuario final ni al cliente. |
