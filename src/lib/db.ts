import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Loosely-typed client for tables/columns added after the last type generation
// (offers, payment fields). Generated types stay in use everywhere else.
export const db = supabase as unknown as SupabaseClient;
