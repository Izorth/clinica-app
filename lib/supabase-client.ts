// En Supabase Dashboard → Database → Replication
// Activar la tabla "Hora" para recibir eventos realtime:
// Source (supabase_realtime) → Tables → activar "Hora"

import { createClient } from "@supabase/supabase-js";

export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
