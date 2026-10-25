import { createClient } from "@supabase/supabase-js";

// Public, read-only menu client for the AustralianBite Supabase project.
// Keep the existing app client separate until its auth/orders schema is migrated.
export const menuSupabase = createClient(
  "https://dpxvtsqqvsmlaqtajoat.supabase.co",
  "sb_publishable_SWeTZiF-9ErOwKv4AeSwUw_RDMr5Ix4",
);
