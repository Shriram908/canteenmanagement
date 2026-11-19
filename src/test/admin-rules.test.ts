import { describe, expect, it } from "vitest";
import { dishInput, outletInput, salesInput, stockStatus } from "@/lib/admin-rules";

const dish = { id: "main-fruit-bowl", outlet_id: "main", name: "Seasonal Fruit Bowl", description: "Fresh fruit", category: "desserts", price_paise: 5000, diet: "vegan", spice: 0, prep_mins: 5, allergens: null, available: true, popular: false, stock: 1 };
const outlet = { id: "main", name: "Main Canteen", location: "Campus", opens: "08:00", closes: "20:00", accepting_orders: true, counter_payments: false, tax_basis_points: 0 };

describe("Administration rules", () => {
  it("keeps prices in integer paise", () => {
    expect(dishInput.parse(dish).price_paise).toBe(5000);
    expect(dishInput.safeParse({ ...dish, price_paise: 50.5 }).success).toBe(false);
  });
  it("accepts restocking and rejects negative or fractional portions", () => {
    expect(dishInput.parse(dish).stock).toBe(1);
    for (const stock of [-1, 0.5]) expect(dishInput.safeParse({ ...dish, stock }).success).toBe(false);
  });
  it("requires stock and listing before a meal is available", () => {
    expect(stockStatus({ available: true, stock: 1 })).toBe("available");
    expect(stockStatus({ available: true, stock: 0 })).toBe("sold-out");
    expect(stockStatus({ available: false, stock: 10 })).toBe("unlisted");
  });
  it("permits online payments only", () => {
    expect(outletInput.parse(outlet).counter_payments).toBe(false);
    expect(outletInput.safeParse({ ...outlet, counter_payments: true }).success).toBe(false);
  });
  it("validates IST operating hours", () => {
    expect(outletInput.parse(outlet).opens).toBe("08:00");
    expect(outletInput.safeParse({ ...outlet, opens: "25:00" }).success).toBe(false);
  });
  it("rejects reversed sales intervals", () => {
    const interval = { outlet: "main", from: "2026-11-18T18:30:00Z", to: "2026-11-19T18:30:00Z" };
    expect(salesInput.safeParse(interval).success).toBe(true);
    expect(salesInput.safeParse({ ...interval, from: interval.to, to: interval.from }).success).toBe(false);
  });
});