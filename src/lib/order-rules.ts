import { z } from "zod";
import { cartInput } from "./cart-rules";

export const checkoutInput = z
  .object({
    cart: cartInput,
    idempotencyKey: z.string().uuid(),
    expectedTotal: z.number().int().positive(),
    notes: z.string().trim().max(300),
  })
  .strict();
export const orderActionInput = z
  .object({
    id: z.string().uuid(),
    action: z.enum(["preparing", "ready", "completed", "cancelled", "paid"]),
  })
  .strict();
export function canTransition(status: string, next: string, payment: string) {
  return (
    payment === "paid" &&
    ((status === "confirmed" && next === "preparing") ||
      (status === "preparing" && next === "ready") ||
      (status === "ready" && next === "completed"))
  );
}
export const canCancel = (status: string, payment: string) =>
  status === "confirmed" && payment !== "paid";
