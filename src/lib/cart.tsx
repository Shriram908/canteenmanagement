import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { outlets } from "./menu-data";

export const MAX_QTY = 10;
interface CartState { outletId: string; items: Record<string, number>; }
interface Ctx extends CartState {
  setOutlet: (id: string) => void; add: (dishId: string) => void; setQty: (dishId: string, q: number) => void; clear: () => void;
}
const CartCtx = createContext<Ctx | null>(null);
const KEY = "foodbook-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({ outletId: outlets[0].id, items: {} });
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setState(JSON.parse(s)); } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(state)); }, [state, loaded]);

  const setQty = (id: string, q: number) => setState((s) => {
    const items = { ...s.items };
    const n = Math.max(0, Math.min(MAX_QTY, Math.floor(q)));
    if (n === 0) delete items[id]; else items[id] = n;
    return { ...s, items };
  });
  return (
    <CartCtx.Provider value={{ ...state,
      setOutlet: (outletId) => setState({ outletId, items: {} }),
      add: (id) => setQty(id, (state.items[id] ?? 0) + 1), setQty,
      clear: () => setState((s) => ({ ...s, items: {} })) }}>
      {children}
    </CartCtx.Provider>
  );
}
export function useCart() { const c = useContext(CartCtx); if (!c) throw new Error("CartProvider missing"); return c; }
