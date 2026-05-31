import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null | undefined;

export function getSupabaseClient() {
  if (supabase !== undefined) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    supabase = null;
    return supabase;
  }

  supabase = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  });
  return supabase;
}
