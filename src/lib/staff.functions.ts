import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { orderActionInput } from "./order-rules";
import { dishInput, outletInput, salesInput } from "./admin-rules";

export const getStaffAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error("Staff access could not be checked.");
    return {
      admin: data.some((r) => r.role === "admin"),
      kitchen: data.some((r) => r.role === "admin" || r.role === "kitchen"),
    };
  });

export const getSalesSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => salesInput.parse(input))
  .handler(async ({ context, data }) => {
    const { data: allowed, error: accessError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (accessError || !allowed) throw new Error("Administrator access required.");
    const { data: summary, error } = await context.supabase.rpc("sales_summary", {
      p_outlet: data.outlet,
      p_from: data.from,
      p_to: data.to,
    });
    if (error) throw new Error("Sales totals could not be loaded.");
    return z
      .object({
        orders: z.number(),
        paid_orders: z.number(),
        collected_paise: z.number(),
        cancelled: z.number(),
        refunded_paise: z.number(),
      })
      .parse(summary);
  });

export const getStaffOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        outlet: z.enum(["main", "hostel"]),
        page: z.number().int().min(0),
        active: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: roles, error: accessError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (accessError || !roles?.some((r) => r.role === "admin" || r.role === "kitchen"))
      throw new Error("Staff access required.");
    let query = context.supabase
      .from("orders")
      .select("*,order_items(*),order_events(*)", { count: "exact" })
      .eq("outlet_id", data.outlet);
    if (data.active) query = query.in("status", ["confirmed", "preparing", "ready"]);
    const {
      data: orders,
      error,
      count,
    } = await query
      .order("created_at", { ascending: data.active })
      .range(data.page * 30, data.page * 30 + 29);
    if (error) throw new Error("Orders could not be loaded.");
    return { orders, count: count ?? 0 };
  });

export const updateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => orderActionInput.parse(input))
  .handler(async ({ context, data }) => {
    if (data.action === "paid") throw new Error("Online payments require provider verification.");
    const { data: roles, error: accessError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (accessError || !roles?.some((r) => r.role === "admin" || r.role === "kitchen"))
      throw new Error("Staff access required.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("change_order", {
      p_user: context.userId,
      p_order: data.id,
      p_action: data.action,
    });
    if (error)
      throw new Error("The order changed or this action is not allowed. Refresh and retry.");
    return { ok: true };
  });

export const saveDish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => dishInput.parse(input))
  .handler(async ({ context, data }) => {
    const { data: allowed } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!allowed) throw new Error("Administrator access required.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("dishes").upsert(data);
    if (error) throw new Error("The dish could not be saved.");
    return { ok: true };
  });

export const saveOutlet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => outletInput.parse(input))
  .handler(async ({ context, data }) => {
    const { data: allowed } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!allowed) throw new Error("Administrator access required.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...values } = data;
    if (values.counter_payments) throw new Error("This application accepts online payments only.");
    const { data: saved, error } = await supabaseAdmin.from("outlets").update(values).eq("id", id).select("id").single();
    if (error || !saved) throw new Error("Outlet settings could not be saved.");
    return { ok: true };
  });
