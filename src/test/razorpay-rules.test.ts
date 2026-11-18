import { describe, expect, it } from "vitest";
import { matchesCapturedPayment, paymentInput, RAZORPAY_TEST_KEY_ID } from "../lib/razorpay-rules";
const captured = { id: "pay_test123", order_id: "order_test123", amount: 6500, currency: "INR", status: "captured", captured: true };
describe("Razorpay test checkout", () => {
  it("uses only the requested test checkout mode", () => { expect(RAZORPAY_TEST_KEY_ID.startsWith("rzp_test_")).toBe(true); });
  it("accepts only captured payment for the exact order, payment, integer paise and INR", () => {
    expect(matchesCapturedPayment(captured, "order_test123", "pay_test123", 6500)).toBe(true);
    for (const change of [{ id: "pay_other" }, { order_id: "order_other" }, { amount: 65 }, { currency: "USD" }, { status: "authorized" }, { captured: false }]) {
      expect(matchesCapturedPayment({ ...captured, ...change }, "order_test123", "pay_test123", 6500)).toBe(false);
    }
  });
  it("rejects arbitrary provider paths and unsigned extra fields", () => {
    expect(paymentInput.safeParse({ orderId: "00000000-0000-4000-8000-000000000001", paymentId: "../orders" }).success).toBe(false);
    expect(paymentInput.safeParse({ orderId: "00000000-0000-4000-8000-000000000001", paymentId: "pay_test123", paid: true }).success).toBe(false);
  });
});
