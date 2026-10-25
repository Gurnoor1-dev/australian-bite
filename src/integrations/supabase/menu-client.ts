import { supabase } from "@/integrations/supabase/client";
// One client and one auth session for every page, including the public menu.
export const menuSupabase = supabase;
