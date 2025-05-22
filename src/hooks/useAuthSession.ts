
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAuthSession() {
  const [session, setSession] = useState<null | NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>>["data"]["session"]>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsChecking(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    isChecking,
    userId: session?.user?.id ?? null
  };
}
