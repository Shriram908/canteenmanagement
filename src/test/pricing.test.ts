import { describe, it, expect } from "vitest";
import { quote } from "@/lib/pricing";
describe("quote", () => {
  it("sums integer paise with ₹5 packaging per item", () => {
    expect(quote([{ pricePaise: 6000, qty: 2 }, { pricePaise: 1500, qty: 1 }])).toMatchObject({ subtotal: 13500, packaging: 1500, total: 15000 });
  });
  it("rounds tax to the nearest paisa", () => {
    expect(quote([{ pricePaise: 3333, qty: 1 }], 500).tax).toBe(167);
  });
});
