import { describe, expect, it } from "vitest";
import { canTransition, canCancel, checkoutInput } from "@/lib/order-rules";
import { isOutletOpen } from "@/lib/menu-data";

describe("order lifecycle", () => {
  it("requires preparation before ready and paid pickup before completion", () => {
    expect(canTransition("confirmed", "preparing", "paid")).toBe(true);
    expect(canTransition("confirmed", "preparing", "pending")).toBe(false);
    expect(canTransition("confirmed", "ready", "paid")).toBe(false);
    expect(canTransition("preparing", "ready", "paid")).toBe(true);
    expect(canTransition("ready", "completed", "pending")).toBe(false);
    expect(canTransition("ready", "completed", "paid")).toBe(true);
    expect(canTransition("completed", "preparing", "paid")).toBe(false);
  });
  it("only permits unpaid confirmed orders to cancel", () => {
    expect(canCancel("confirmed", "pending")).toBe(true);
    expect(canCancel("confirmed", "paid")).toBe(false);
    expect(canCancel("preparing", "pending")).toBe(false);
    expect(canCancel("cancelled", "pending")).toBe(false);
  });
  it("requires integer paise and one outlet at checkout", () => {
    const input = {
      cart: { outletId: "main", items: { "main-chai": 1 } },
      idempotencyKey: "00000000-0000-4000-8000-000000000001",
      expectedTotal: 2000,
      notes: "",
    };
    expect(checkoutInput.parse(input).expectedTotal).toBe(2000);
    expect(checkoutInput.safeParse({ ...input, expectedTotal: 20.5 }).success).toBe(false);
  });
  it("evaluates overnight opening hours in IST", () => {
    const outlet = {
      id: "main",
      name: "Canteen",
      location: "Campus",
      opens: "22:00",
      closes: "02:00",
    };
    expect(isOutletOpen(outlet, new Date("2026-11-17T18:00:00Z"))).toBe(true);
    expect(isOutletOpen(outlet, new Date("2026-11-17T21:00:00Z"))).toBe(false);
  });
});
