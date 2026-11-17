import { z } from "zod";

export const MAX_QTY = 10;
export const cartInput = z.object({
  outletId: z.enum(["main", "hostel"]),
  items: z.record(z.string().min(1).max(100), z.number().int().min(1).max(MAX_QTY))
    .refine((items) => Object.keys(items).length <= 100, "Too many dishes"),
}).strict();
export type CartState = z.infer<typeof cartInput>;
export interface CartDish { id: string; outletId: string; available: boolean; pricePaise: number; }

export function validateCart(input: unknown, menu: CartDish[]) {
  const cart = cartInput.parse(input);
  const lines = Object.entries(cart.items).map(([id, qty]) => {
    const dish = menu.find((item) => item.id === id);
    if (!dish || dish.outletId !== cart.outletId) throw new Error("A cart must contain dishes from one outlet.");
    if (!dish.available) throw new Error(`${id} is sold out. Remove it before checkout.`);
    return { dish, qty };
  });
  if (lines.length === 0) throw new Error("Your cart is empty.");
  return { cart, lines };
}

/** A guest cart from a different outlet replaces the saved cart; never combine outlets. */
export function mergeCarts(saved: CartState, guest: CartState): CartState {
  if (Object.keys(guest.items).length === 0) return saved;
  if (saved.outletId !== guest.outletId) return guest;
  const items = { ...saved.items };
  for (const [id, qty] of Object.entries(guest.items)) items[id] = Math.min(MAX_QTY, (items[id] ?? 0) + qty);
  return { outletId: guest.outletId, items };
}