import { z } from "zod";

export const dishInput = z.object({
  id: z.string().min(1).max(100),
  outlet_id: z.enum(["main", "hostel"]),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500),
  category: z.enum(["breakfast", "main", "breads", "soups", "beverages", "desserts"]),
  price_paise: z.number().int().min(1).max(1000000),
  diet: z.enum(["veg", "vegan", "nonveg", "egg"]),
  spice: z.number().int().min(0).max(3),
  prep_mins: z.number().int().min(1).max(180),
  allergens: z.array(z.string().trim().min(1).max(80)).max(20).nullable(),
  available: z.boolean(),
  popular: z.boolean(),
  stock: z.number().int().min(0).max(100000),
}).strict();

export const outletInput = z.object({
  id: z.enum(["main", "hostel"]),
  name: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(200),
  opens: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  closes: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  accepting_orders: z.boolean(),
  counter_payments: z.literal(false),
  tax_basis_points: z.number().int().min(0).max(10000),
}).strict();

export const salesInput = z.object({
  outlet: z.enum(["main", "hostel"]),
  from: z.string().datetime(),
  to: z.string().datetime(),
}).strict().refine((v) => Date.parse(v.from) < Date.parse(v.to), {
  message: "The end date must be after the start date.",
});

export type StockStatus = "available" | "sold-out" | "unlisted";
export function stockStatus(dish: { available: boolean; stock: number }): StockStatus {
  if (!dish.available) return "unlisted";
  return dish.stock > 0 ? "available" : "sold-out";
}