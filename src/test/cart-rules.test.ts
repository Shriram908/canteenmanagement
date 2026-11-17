import { describe, expect, it } from "vitest";
import { mergeCarts, validateCart } from "@/lib/cart-rules";
import { quote } from "@/lib/pricing";

const menu = [
  { id: "main-dosa", outletId: "main", available: true, pricePaise: 6000 },
  { id: "hostel-chai", outletId: "hostel", available: true, pricePaise: 1500 },
  { id: "main-egg", outletId: "main", available: false, pricePaise: 9500 },
];
describe("ordering rules", () => {
  it("rejects a cart spanning outlets", () => {
    expect(() => validateCart({ outletId: "main", items: { "hostel-chai": 1 } }, menu)).toThrow("one outlet");
  });
  it("rejects sold-out dishes", () => {
    expect(() => validateCart({ outletId: "main", items: { "main-egg": 1 } }, menu)).toThrow("sold out");
  });
  it("rejects unknown dishes", () => {
    expect(() => validateCart({ outletId: "main", items: { invented: 1 } }, menu)).toThrow();
  });
  it("allows ten but not eleven of a dish", () => {
    expect(validateCart({ outletId: "main", items: { "main-dosa": 10 } }, menu).lines[0]?.qty).toBe(10);
    expect(() => validateCart({ outletId: "main", items: { "main-dosa": 11 } }, menu)).toThrow();
  });
  it("uses menu prices rather than a client-provided total", () => {
    expect(() => validateCart({ outletId: "main", items: { "main-dosa": 2 }, total: 1 }, menu)).toThrow();
    const { lines } = validateCart({ outletId: "main", items: { "main-dosa": 2 } }, menu);
    expect(quote(lines.map(({ dish, qty }) => ({ pricePaise: dish.pricePaise, qty }))).total).toBe(13000);
  });
  it("merges quantities up to ten", () => {
    expect(mergeCarts({ outletId: "main", items: { "main-dosa": 8 } }, { outletId: "main", items: { "main-dosa": 5 } }).items).toEqual({ "main-dosa": 10 });
  });
  it("never merges across outlets", () => {
    expect(mergeCarts({ outletId: "main", items: { "main-dosa": 1 } }, { outletId: "hostel", items: { "hostel-chai": 2 } })).toEqual({ outletId: "hostel", items: { "hostel-chai": 2 } });
  });
});