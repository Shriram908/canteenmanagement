import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkoutInput } from "./order-rules";
import { paymentInput, matchesCapturedPayment, RAZORPAY_TEST_KEY_ID } from "./razorpay-rules";
import { quote } from "./pricing";
import { validateCart } from "./cart-rules";

export const startTestPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => checkoutInput.parse(input))
  .handler(async ({ context, data }) => {
    const { data: menu, error: menuError } = await context.supabase.from("dishes").select("id,outlet_id,available,price_paise,stock").eq("outlet_id", data.cart.outletId);
    const { data: outlet, error: outletError } = await context.supabase.from("outlets").select("tax_basis_points").eq("id", data.cart.outletId).single();
    if (menuError || outletError || !outlet || !menu) throw new Error("The menu could not be checked. Try again.");
    // Existing attempts must be resumable even after their reservation consumed the last item.
    const { data: existing } = await context.supabase.from("orders").select("id").eq("idempotency_key", data.idempotencyKey).eq("user_id", context.userId).maybeSingle();
    let orderId = existing?.id;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!orderId) {
      const { lines } = validateCart(data.cart, menu.map(d => ({ id: d.id, outletId: d.outlet_id, available: d.available && d.stock > 0, pricePaise: d.price_paise })));
      const totals = quote(lines.map(({dish, qty}) => ({ pricePaise: dish.pricePaise, qty })), outlet.tax_basis_points);
      if (totals.total !== data.expectedTotal) throw new Error("Prices changed. Refresh your cart before paying.");
      const result = await supabaseAdmin.rpc("reserve_test_order", { p_user: context.userId, p_outlet: data.cart.outletId, p_items: data.cart.items, p_key: data.idempotencyKey, p_notes: data.notes, p_total: totals.total, p_packaging: totals.packaging });
      if (result.error) throw new Error(result.error.message);
      orderId = result.data;
    }
    const { data: order, error } = await context.supabase.from("orders").select("id,total_paise,razorpay_order_id,status,payment_mode").eq("id", orderId).eq("user_id", context.userId).single();
    if (error || !order || order.payment_mode !== "test") throw new Error("This test order could not be loaded.");
    if (order.status !== "awaiting_payment") throw new Error("This order is no longer awaiting payment. Check your orders.");
    let providerId = order.razorpay_order_id;
    if (!providerId) {
      const claim = await supabaseAdmin.rpc("claim_test_payment", { p_user: context.userId, p_order: order.id });
      if (claim.error || !claim.data) throw new Error("Payment setup is already in progress. Check your orders before trying again.");
      const { createProviderOrder } = await import("./razorpay.server");
      const provider = await createProviderOrder(order.id, order.total_paise);
      if (provider.amount !== order.total_paise) throw new Error("Razorpay amount did not match the order.");
      const saved = await supabaseAdmin.from("orders").update({ razorpay_order_id: provider.id }).eq("id", order.id).eq("user_id", context.userId);
      if (saved.error) throw new Error("Payment setup needs recovery. Do not create another payment.");
      providerId = provider.id;
    }
    return { orderId: order.id, providerOrderId: providerId, amount: order.total_paise, keyId: RAZORPAY_TEST_KEY_ID };
  });

export const verifyTestPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => paymentInput.parse(input))
  .handler(async ({ context, data }) => {
    const { data: order, error } = await context.supabase.from("orders").select("id,total_paise,razorpay_order_id,payment_mode").eq("id", data.orderId).eq("user_id", context.userId).single();
    if (error || !order || !order.razorpay_order_id || order.payment_mode !== "test") throw new Error("This test order could not be found.");
    // Provider credentials stay in the connector. Verify via authenticated API, not a browser claim.
    const { readProviderPayment, captureProviderPayment } = await import("./razorpay.server");
    let payment = await readProviderPayment(data.paymentId);
    if (payment.order_id !== order.razorpay_order_id || payment.amount !== order.total_paise || payment.currency !== "INR") throw new Error("The payment does not match this order.");
    if (payment.status === "authorized") payment = await captureProviderPayment(data.paymentId, order.total_paise);
    if (!matchesCapturedPayment(payment, order.razorpay_order_id, data.paymentId, order.total_paise)) throw new Error("Payment has not been captured. Check your orders before paying again.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.rpc("confirm_test_payment", { p_user: context.userId, p_order: order.id, p_provider_order: order.razorpay_order_id, p_payment: payment.id, p_amount: payment.amount });
    if (result.error) throw new Error("Payment was captured but the order needs recovery. Do not pay again.");
    return { orderId: order.id, paid: true };
  });
