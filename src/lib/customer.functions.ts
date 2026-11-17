import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cartInput } from "./cart-rules";

export const getCustomer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("profiles").select("display_name").eq("id", context.userId).single();
    if (error) throw new Error("Your profile could not be loaded.");
    return data;
  });

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ displayName: z.string().trim().max(80) }).strict().parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("profiles").update({ display_name: data.displayName }).eq("id", context.userId);
    if (error) throw new Error("Your name could not be saved.");
    return { ok: true };
  });

export const getSavedCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("carts").select("outlet_id, items").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error("Your saved cart could not be loaded.");
    return data ? cartInput.parse({ outletId: data.outlet_id, items: data.items }) : null;
  });

export const saveCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => cartInput.parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("carts").upsert({ user_id: context.userId, outlet_id: data.outletId, items: data.items, updated_at: new Date().toISOString() });
    if (error) throw new Error("Your cart could not be saved.");
    return { ok: true };
  });

export const getCustomerOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ page: z.number().int().min(0).max(10000) }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: orders, error } = await context.supabase.from("orders")
      .select("id, outlet_id, status, payment_status, payment_method, notes, total_paise, created_at, order_items(dish_name, quantity, unit_price_paise)")
      .eq("user_id", context.userId).order("created_at", { ascending: false }).range(data.page * 20, data.page * 20 + 19);
    if (error) throw new Error("Your orders could not be loaded.");
    return orders;
  });