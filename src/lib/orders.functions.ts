import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { orderActionInput } from "./order-rules";

export const cancelOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => orderActionInput.parse(input))
  .handler(async ({ context, data }) => {
    if (data.action !== "cancelled") throw new Error("Only cancellation is allowed here.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("change_order", {
      p_user: context.userId,
      p_order: data.id,
      p_action: "cancelled",
    });
    if (error) throw new Error("This order can no longer be cancelled.");
    return { ok: true };
  });
