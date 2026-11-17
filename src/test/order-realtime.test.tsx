import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOrderRealtime } from "@/hooks/use-order-realtime";

const mocks = vi.hoisted(() => ({
  user: { id: "customer-a" } as { id: string } | null,
  invalidate: vi.fn(),
  remove: vi.fn(),
  channel: vi.fn(),
  bindings: [] as Array<{ name: string; filter: string; event: () => void; status: (status: string) => void; channel: unknown }>,
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => client }));
const client = { invalidateQueries: mocks.invalidate };
vi.mock("@/integrations/supabase/client", () => ({ supabase: { channel: mocks.channel, removeChannel: mocks.remove } }));

beforeEach(() => {
  vi.useFakeTimers();
  mocks.user = { id: "customer-a" };
  mocks.bindings = [];
  mocks.invalidate.mockReset();
  mocks.remove.mockReset();
  mocks.channel.mockReset().mockImplementation((name: string) => {
    const binding = { name, filter: "", event: () => {}, status: (_status: string) => {}, channel: {} };
    const channel = {
      on: (_type: string, options: { filter: string }, callback: () => void) => {
        binding.filter = options.filter; binding.event = callback; return channel;
      },
      subscribe: (callback: (status: string) => void) => { binding.status = callback; return channel; },
    };
    binding.channel = channel;
    mocks.bindings.push(binding);
    return channel;
  });
});
afterEach(() => vi.useRealTimers());

describe("live order synchronization", () => {
  it("subscribes only to the signed-in customer's orders and batches changes", () => {
    const hook = renderHook(() => useOrderRealtime());
    expect(mocks.bindings[0]?.filter).toBe("user_id=eq.customer-a");
    act(() => { mocks.bindings[0]?.event(); mocks.bindings[0]?.event(); vi.advanceTimersByTime(100); });
    expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ["orders"] });
    expect(mocks.invalidate).toHaveBeenCalledTimes(2);
    hook.unmount();
    expect(mocks.remove).toHaveBeenCalledWith(mocks.bindings[0]?.channel);
  });
  it("refreshes the selected staff outlet and sales after reconnecting", () => {
    const hook = renderHook(() => useOrderRealtime("hostel"));
    expect(mocks.bindings[0]?.filter).toBe("outlet_id=eq.hostel");
    act(() => { mocks.bindings[0]?.status("SUBSCRIBED"); vi.advanceTimersByTime(100); });
    expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ["staff-orders", "hostel"] });
    expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ["sales", "hostel"] });
    hook.unmount();
  });
  it("cleans up and resubscribes with a unique channel when the account changes", () => {
    const hook = renderHook(() => useOrderRealtime());
    mocks.user = { id: "customer-b" };
    hook.rerender();
    expect(mocks.remove).toHaveBeenCalledWith(mocks.bindings[0]?.channel);
    expect(mocks.bindings[1]?.filter).toBe("user_id=eq.customer-b");
    expect(mocks.bindings[1]?.name).not.toBe(mocks.bindings[0]?.name);
    act(() => { mocks.bindings[0]?.event(); vi.advanceTimersByTime(100); });
    expect(mocks.invalidate).not.toHaveBeenCalled();
    hook.unmount();
  });
  it("does not subscribe while signed out and cancels pending work on unmount", () => {
    mocks.user = null;
    const hook = renderHook(() => useOrderRealtime());
    expect(mocks.channel).not.toHaveBeenCalled();
    mocks.user = { id: "customer-a" }; hook.rerender();
    act(() => mocks.bindings[0]?.event());
    hook.unmount();
    act(() => vi.advanceTimersByTime(100));
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
});