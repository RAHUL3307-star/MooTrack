import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

// ─── Environment Variables ────────────────────────────────────────────────────
// Add your Supabase credentials to mobile-app/.env:
//   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
//   VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
//
// Organization: COw sensing
// Project: cow-sensing-db (create via https://supabase.com/dashboard)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// ─── Connectivity Check ───────────────────────────────────────────────────────
export const isSupabaseConfigured =
  typeof supabaseUrl === "string" &&
  supabaseUrl.startsWith("https://") &&
  typeof supabaseAnonKey === "string" &&
  supabaseAnonKey.length > 10;

// ─── Client ───────────────────────────────────────────────────────────────────
// If credentials are not yet set, we create a no-op placeholder so the app
// does not throw on import, but falls back to local data in every service.
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
  : null;

// ─── Helper ───────────────────────────────────────────────────────────────────
/** Returns true when the Supabase client is available and (optionally) the
 *  table/query succeeded without network errors. Callers should always fall
 *  back to local data when this returns false. */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from("animals").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
