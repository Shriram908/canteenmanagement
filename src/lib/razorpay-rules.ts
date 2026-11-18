import { z } from "zod";

export const RAZORPAY_TEST_KEY_ID = "rzp_test_U1LskOhBSen792";
export const paymentInput = z.object({ orderId: z.string().uuid(), paymentId: z.string().regex(/^pay_[a-zA-Z0-9]+$/) }).strict();
export interface ProviderPayment { id: string; order_id: string; amount: number; currency: string; status: string; captured: boolean; }
export function matchesCapturedPayment(payment: ProviderPayment, orderId: string, paymentId: string, amount: number) {
  return payment.id === paymentId && payment.order_id === orderId && payment.amount === amount && payment.currency === "INR" && payment.status === "captured" && payment.captured === true;
}
