import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    const uid = session?.user?.id;
    if (!uid) {
      setIsStaff(false);
      return;
    }
    supabase
      .rpc("is_staff", { _user_id: uid })
      .then(({ data }) => {
        if (active) setIsStaff(Boolean(data));
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const user: User | null = session?.user ?? null;
  return { session, user, loading, isStaff };
}