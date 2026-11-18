import { z } from "zod";
const orderSchema = z.object({ id: z.string().regex(/^order_[a-zA-Z0-9]+$/), amount: z.number().int(), currency: z.literal("INR"), status: z.string() });
const paymentSchema = z.object({ id: z.string(), order_id: z.string(), amount: z.number().int(), currency: z.string(), status: z.string(), captured: z.boolean() });
async function request(path: string, body?: object) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["UDC_RAZORPAY_6_API_KEY"];
  if (!apiKey || !connectionKey) throw new Error("Razorpay test payments are not configured.");
  const response = await fetch(`https://connector-gateway.lovable.dev/udc_razorpay_6/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${apiKey}`, "X-Connection-Api-Key": connectionKey, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    // Do not log provider bodies: they may contain private payment/customer data.
    console.error("Razorpay request failed", response.status);
    throw new Error(`Razorpay could not complete this request (${response.status}). Please try again.`);
  }
  return response.json();
}
export async function createProviderOrder(id: string, amount: number) {
  return orderSchema.parse(await request("orders", { amount, currency: "INR", receipt: id }));
}
export async function readProviderPayment(id: string) { return paymentSchema.parse(await request(`payments/${id}`)); }
export async function captureProviderPayment(id: string, amount: number) { return paymentSchema.parse(await request(`payments/${id}/capture`, { amount, currency: "INR" })); }
