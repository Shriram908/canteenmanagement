import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

/** Notifications invalidate verified reads; event payloads never populate private caches. */
export function useOrderRealtime(outlet?: "main" | "hostel") {
  const { user } = useAuth();
  const userId = user?.id;
  const client = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (!active || timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        if (!active) return;
        void client.invalidateQueries({ queryKey: ["orders"] });
        if (outlet) {
          void client.invalidateQueries({ queryKey: ["staff-orders", outlet] });
          void client.invalidateQueries({ queryKey: ["sales", outlet] });
        }
        void client.invalidateQueries({ queryKey: ["catalog"] });
      }, 100);
    };
    const channel = supabase
      .channel(`foodbook-orders-${crypto.randomUUID()}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: outlet ? `outlet_id=eq.${outlet}` : `user_id=eq.${userId}`,
      }, refresh)
      .subscribe((status) => {
        // Refresh on initial connection and reconnection to recover missed events.
        if (status === "SUBSCRIBED") refresh();
      });
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [userId, outlet, client]);
}