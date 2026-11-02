import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "https://dpxvtsqqvsmlaqtajoat.supabase.co";
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_SWeTZiF-9ErOwKv4AeSwUw_RDMr5Ix4";

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});