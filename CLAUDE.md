# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

`clinica-app` is a Next.js (App Router) SaaS for managing Chilean medical clinics — agenda/scheduling, patients (pacientes), doctors (médicos), and payments (pagos). UI strings, data models, and domain logic are in Spanish; keep new code consistent with that (e.g. `Paciente`, `Hora`, `rol`, error messages in Spanish).

## Commands

- `npm run dev` — start dev server (Next.js)
- `npm run build` / `npm run start` — production build / run
- `npm run lint` — ESLint
- `npm run test` — run the full Vitest suite once
- `npm run test:watch` — Vitest watch mode
- Single test file: `npx vitest run lib/utils/dates.test.ts`
- `npm run seed` — seed the database via `scripts/seed.ts` (ts-node, loads `.env`)
- Prisma: `npx prisma generate` after schema changes, `npx prisma migrate dev` for new migrations

**Package manager: pnpm.** Use `pnpm add` / `pnpm add -D` to change dependencies — never `npm install`, which would recreate `package-lock.json` and make the build's package-manager detection ambiguous. `package-lock.json` was a leftover from `create-next-app`, stale since 2026-06-03, and was deleted on 2026-08-10; `pnpm-lock.yaml` is the only lockfile.

`pnpm-workspace.yaml` is not about workspaces here — it carries the `allowBuilds` allowlist of packages permitted to run install scripts (prisma, sharp, puppeteer…). A new dependency that needs a postinstall must be added there or its script is silently skipped.

Running scripts through npm (`npm run test`, `npm run build`) is harmless — npm is only a task runner there and never touches the lockfile. The rule applies to installing dependencies, not to running scripts.

## Architecture

**Stack**: Next.js 16 (App Router) + React 19, Prisma 6 (PostgreSQL via Supabase), NextAuth (credentials provider, JWT sessions), TanStack Query for client data fetching, Tailwind v4 + shadcn/radix-ui for UI, Twilio WhatsApp for reminders.

**Auth & authorization** (`lib/auth.ts`, `lib/auth-helpers.ts`):
- NextAuth credentials provider checks `Usuario.email` + bcrypt-hashed password; JWT carries `sub` (user id) and `rol`.
- Three roles: `ADMIN`, `MEDICO`, `RECEPCIONISTA` (`lib/utils/roles.ts`).
- Every API route protects itself explicitly by calling `requireAuth()` or `requireRole([...])` from `lib/auth-helpers.ts` at the top of each handler — there is no global middleware enforcing this, so new routes must add the check themselves.

**Data layer**:
- Prisma schema (`prisma/schema.prisma`) models: `Usuario` (1:1 with `Medico`), `Medico`, `Paciente`, `Hora` (an appointment, has `EstadoHora`: PENDIENTE/CONFIRMADA/CANCELADA/COMPLETADA), `Ficha` (clinical note per paciente), `Pago` (1:1 with `Hora`, has `EstadoPago`).
- `lib/prisma.ts` exports a singleton `PrismaClient` (standard Next.js dev hot-reload guard).
- Shared Prisma `include` shapes live in `lib/prisma/includes.ts` (e.g. `horaInclude`) — reuse these instead of redefining include objects per route.
- Domain enums are mirrored as plain TS types/label maps in `lib/utils/roles.ts` and `lib/utils/estados.ts` (label strings + Tailwind class maps for badges/dots) rather than imported from Prisma's generated enums, for use in client components.

**API routes** (`app/api/**/route.ts`): plain Next.js Route Handlers, no separate service layer. Pattern per route: `requireAuth`/`requireRole` check → parse/validate `request.nextUrl.searchParams` or JSON body → Prisma call → `Response.json(...)`. Most list/mutation routes set `export const dynamic = "force-dynamic"`. Prisma unique-constraint violations are caught by checking `error.code === "P2002"`.

**Client data fetching**: components use TanStack Query hooks under `lib/hooks/` (e.g. `usePacientes.ts`, `useMedicos.ts`, `useHoras.ts`, `useDashboardStats.ts`) that wrap `fetch` calls to the API routes above. These hooks also define the client-side TS types for API responses (not generated from Prisma). Add new data access through a hook here rather than calling `fetch` directly from components.

**Scheduled jobs / integrations**:
- `app/api/cron/recordatorios/route.ts` is invoked by Vercel Cron (see `vercel.json`, daily at 13:00 UTC) and protected by a `Bearer ${CRON_SECRET}` header check, not user auth. It finds tomorrow's PENDIENTE/CONFIRMADA `Hora`s and sends WhatsApp reminders.
- `lib/twilio.ts` wraps the Twilio WhatsApp template API; `normalizarTelefono` normalizes Chilean phone numbers to `+56...` before sending.
- `app/api/webhooks/twilio/route.ts` receives Twilio webhook callbacks.

**Timezone handling**: the app's business timezone is `America/Santiago`. Use `lib/utils/dates.ts` (`toSantiagoDate`, `formatHoraSantiago`) instead of doing raw `Date` math, since Santiago's UTC offset changes between summer/winter (no DST-naive assumptions).

**Routing structure**: `app/dashboard/**` holds authenticated pages (agenda, medicos, pacientes, each with `[id]` detail and `nuevo` create routes); `app/login` is the public sign-in page. `components/` is organized by the same domain split (`agenda/`, `medicos/`, `pacientes/`, `dashboard/`, plus shared `ui/`).

## Design System

Always read [DESIGN.md](DESIGN.md) before making any visual or UI decisions — it defines fonts (Instrument Serif / DM Sans / Geist Mono), the white-label HSL brand color system, the Stone neutral palette, spacing, border-radius, and motion rules in detail. Do not deviate without explicit user approval. In QA mode, flag any code that doesn't match DESIGN.md.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
