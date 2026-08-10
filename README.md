# clinica-app

SaaS para que centros médicos pequeños en Chile gestionen agenda, pacientes y recordatorios por WhatsApp desde un solo lugar.

## Demo

- Demo en vivo: [TODO: URL del demo]
- Credenciales de prueba: [TODO: credenciales de prueba]

## Capturas

![Dashboard](docs/screenshot-dashboard.png)
![Agenda](docs/screenshot-agenda.png)
![Ficha de paciente](docs/screenshot-paciente.png)

*(marcadores — agregar las imágenes en `docs/` cuando existan)*

## El problema

Muchos centros médicos pequeños en Chile todavía coordinan su agenda y sus pacientes en papel, planillas de Excel o hilos de WhatsApp. Eso hace difícil saber quién tiene hora hoy, confirmar asistencia, o llevar un historial clínico ordenado. `clinica-app` reemplaza eso con una agenda centralizada, ficha de paciente y recordatorios automáticos de WhatsApp.

## Estado actual

**Operativo:**
- Autenticación con roles (Administrador, Médico, Recepcionista) vía NextAuth.
- Dashboard con estadísticas del día/mes (pacientes, horas, ingresos del mes, agenda de hoy).
- Agenda de horas: crear, listar y filtrar por médico/rango de fechas. La UI se mantiene al día por polling cada 30s y refetch al enfocar la pestaña (TanStack Query).
- Gestión de médicos: alta, edición, baja (con resguardo si el médico tiene horas agendadas).
- Gestión de pacientes: alta, búsqueda y ficha de detalle (datos personales, historial de horas).
- Recordatorios de horas por WhatsApp (Twilio): envío manual desde la ficha del paciente y envío automático diario vía cron de Vercel para las horas de mañana. Hoy corre contra el número Sandbox de Twilio, no un número de producción propio.
- Webhook de Twilio que recibe la respuesta del paciente (confirmar/cancelar) y actualiza el estado de la hora.

**En desarrollo / incompleto:**
- Fichas médicas (`Ficha`): el modelo de datos y el listado de fichas existen y se muestran en la ficha del paciente, pero son de solo lectura — no hay endpoint para crear o editar una ficha, y el botón "Agregar nueva ficha médica" en la UI todavía no tiene acción asociada.
- Edición y eliminación de pacientes: existe alta y detalle, pero no rutas de edición/baja.
- Pagos (`Pago`): el modelo existe en el esquema y se usa para calcular el ingreso del mes en el dashboard, pero no tiene ninguna ruta API propia — no hay flujo para registrar o gestionar pagos todavía.
- Aislamiento entre centros médicos (multi-tenant): la app hoy sirve a una sola clínica.

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | ^16.2.4 |
| UI | React | 19.2.4 |
| Lenguaje | TypeScript | ^5 |
| Estilos | Tailwind CSS | ^4 |
| Componentes | shadcn/ui + Radix UI | ^4.6.0 / ^1.4.3 |
| ORM | Prisma | ^6.19.3 |
| Base de datos | PostgreSQL (Supabase) | — |
| Autenticación | NextAuth (credentials + JWT) | ^4.24.14 |
| Hashing de contraseñas | bcryptjs | ^3.0.3 |
| Data fetching cliente | TanStack Query | ^5.100.9 |
| Mensajería | Twilio (WhatsApp) | ^6.0.1 |
| Testing | Vitest | ^4.1.8 |

## Decisiones de arquitectura

**1. Sin capa de servicio: rutas API como único punto de entrada al dominio.**
Las rutas en `app/api/**/route.ts` llaman directamente a Prisma — no hay repositorios ni servicios intermedios. [TODO: confirmar razón]

**2. Autorización explícita por ruta, sin middleware global.**
No existe un `middleware.ts` que centralice el control de acceso: cada handler llama a `requireAuth()`/`requireRole()` (o a `getServerSession` directamente) al inicio. [TODO: confirmar razón original]. Con una sola clínica el costo de esa inconsistencia es bajo; al agregar aislamiento entre centros deja de serlo, porque cada ruta que no pase por el helper común es una que puede olvidarse de filtrar por clínica — por eso ese trabajo futuro apunta a que el helper sea el único camino posible, no una convención.

**3. Contraseña excluida por defecto a nivel de cliente Prisma, no por convención en cada query.**
`lib/prisma.ts` configura el cliente con `omit: { usuario: { password: true } }` global, así que cualquier `prisma.usuario.findMany/findUnique` en el proyecto no trae el hash salvo que se pida explícitamente con `omit: { password: false }` (como hace `lib/auth.ts` para verificar login), con una guarda que lanza error si el hash no llega. Cubierto por tests de regresión en `tests/security/no-password-leak.test.ts`, incluido uno que verifica el propio omit global contra su eliminación. Alternativa descartada: `select` explícito campo por campo en cada consulta — más fácil de olvidar en una ruta nueva.

## Tratamiento de datos sensibles

La plataforma maneja datos de pacientes (incluyendo diagnóstico y tratamiento en `Ficha`), que bajo la Ley 21.719 chilena (vigente desde el 1 de diciembre de 2026) son datos sensibles. Medidas efectivamente implementadas hoy:

- Autenticación obligatoria (NextAuth + JWT) y control de acceso por rol (`ADMIN`, `MEDICO`, `RECEPCIONISTA`) en la mayoría de las rutas de mutación.
- Contraseñas hasheadas con bcrypt y excluidas por defecto de cualquier respuesta de la API (ver decisión de arquitectura #3), con test automatizado que lo verifica.
- Row Level Security activo en todas las tablas del esquema `public` en Supabase, sin ninguna política (deniega todo por defecto), y ese esquema fue retirado de los "exposed schemas" de la API de Supabase — el único camino de acceso a los datos es a través de Prisma, no de la API pública de Supabase/PostgREST.
- El endpoint de cron de recordatorios está protegido por un secreto (`Bearer CRON_SECRET`), no por sesión de usuario, ya que lo invoca Vercel Cron sin usuario autenticado.

Pendiente (roadmap de endurecimiento, sin detallar aquí gaps específicos por ruta — ese detalle vive en un documento interno, no en este repo público):
- Aislamiento de datos entre distintos centros médicos (multi-tenant), incluyendo RLS con políticas reales por `clinicaId`.
- Mover la conexión de Prisma de un rol superusuario de base de datos a un rol de aplicación con privilegios mínimos, en conjunto con ese trabajo de aislamiento.
- Registro de auditoría (quién vio o modificó qué ficha/paciente y cuándo).
- Endurecer la autorización más allá de la verificación de sesión en todas las rutas de mutación, y la validación de webhooks entrantes de terceros.
- Entorno de desarrollo separado de producción, y backups automáticos de base de datos.

## Roadmap

- [ ] CRUD completo de fichas médicas (crear/editar, no solo lectura)
- [ ] Edición y eliminación de pacientes
- [ ] Módulo de pagos (registro y seguimiento, hoy solo existe el modelo de datos)
- [ ] Aislamiento multi-centro (multi-tenant) + RLS con políticas reales por clínica
- [ ] Rol de aplicación de privilegio mínimo para Prisma (hoy usa el rol dueño de las tablas)
- [ ] Registro de auditoría sobre datos clínicos
- [ ] Endurecer autorización y validación de webhooks de terceros
- [ ] Entorno de desarrollo separado de producción, con backups automáticos
- [ ] Número de WhatsApp de producción propio (WABA), fuera del Sandbox de Twilio

## Contacto

Gonzalo Simpson Arancibia
- Email: simpson7gonzalo@gmail.com
- LinkedIn: [linkedin.com/in/gonzalo-simpson-arancibia](https://linkedin.com/in/gonzalo-simpson-arancibia)
- GitHub: [github.com/Izorth](https://github.com/Izorth)
