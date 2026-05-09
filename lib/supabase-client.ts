// CONFIGURACIÓN REALTIME EN SUPABASE:
// 1. Dashboard → Database → Replication → Source (supabase_realtime) → Tables → activar "Hora"
//
// 2. Ejecutar en Supabase SQL Editor para habilitar RLS (requerido por postgres_changes):
//
//    ALTER TABLE "Hora" ENABLE ROW LEVEL SECURITY;
//
//    CREATE POLICY "allow_all" ON "Hora"
//    FOR ALL USING (true);
//
// (Política permisiva temporal — restringir antes de producción real)

import { createClient } from "@supabase/supabase-js";

export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
