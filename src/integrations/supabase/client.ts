// Australian Bite now uses its dedicated Supabase project for auth and all application data.
import { createClient } from "@supabase/supabase-js";

const url = "https://dpxvtsqqvsmlaqtajoat.supabase.co";
const publishableKey = "sb_publishable_SWeTZiF-9ErOwKv4AeSwUw_RDMr5Ix4";

export const supabase = createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
