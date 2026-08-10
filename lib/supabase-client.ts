// ESTADO REAL DE RLS EN SUPABASE (verificado con curl + anon key el 03/08/2026):
// - RLS está ACTIVO en todas las tablas del schema `public`, sin ninguna política.
//   RLS activo y sin políticas deniega todo por defecto — es la config correcta.
// - `public` fue sacado de los "exposed schemas" en Settings → API: PostgREST
//   no puede leer ni escribir nada aunque alguien tenga la URL del proyecto y
//   la anon key.
// - Prisma sigue funcionando porque se conecta como el rol dueño de las tablas
//   (postgres), al que RLS no restringe.
//
// ADVERTENCIA — no repetir el error que originó este comentario:
// una política permisiva del tipo `CREATE POLICY ... FOR ALL USING (true)`
// (a veces llamada "allow_all") protege EXACTAMENTE IGUAL que no tener RLS.
// Este proyecto la tuvo en "Hora" para habilitar postgres_changes, el linter
// de Supabase se puso verde, y el agujero (lectura/escritura pública de
// Usuario, Paciente, Medico, Ficha y Pago) siguió abierto hasta que se
// detectó. Nunca uses allow_all para silenciar el linter.
//
// Consecuencia: la suscripción a postgres_changes en agenda-content.tsx y
// dashboard-content.tsx ya no recibe eventos (public no está expuesto). Es
// una decisión tomada, no un bug — el polling de 30s + refetch on focus de
// TanStack Query cubre la actualización de la UI.

import { createClient } from "@supabase/supabase-js";

export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
