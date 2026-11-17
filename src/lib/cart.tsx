import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useCatalog } from "./catalog";
import { cartInput, mergeCarts, MAX_QTY, type CartState } from "./cart-rules";
import { getSavedCart, saveCart } from "./customer.functions";
import { useAuth } from "./auth";

export { MAX_QTY } from "./cart-rules";
interface Ctx extends CartState {
  setOutlet: (id: string) => void; add: (dishId: string) => void; setQty: (dishId: string, q: number) => void; clear: () => void;
  syncError: string; syncing: boolean;
}
const CartCtx = createContext<Ctx | null>(null);
const KEY = "foodbook-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const { outlets, dishes } = useCatalog();
  const [state, setState] = useState<CartState>({ outletId: "main", items: {} });
  const [loaded, setLoaded] = useState(false);
  const { user, loading } = useAuth();
  const [syncedUser, setSyncedUser] = useState<string | null>(null);
  const [syncError, setSyncError] = useState("");
  const previousUser = useRef<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const readCart = useServerFn(getSavedCart);
  const writeCart = useMutation({ mutationFn: useServerFn(saveCart) });
  const writeRef = useRef(writeCart.mutateAsync);
  writeRef.current = writeCart.mutateAsync;
  const saveQueue = useRef(Promise.resolve());
  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) {
      const parsed = cartInput.safeParse(JSON.parse(s));
      if (parsed.success) setState({ ...parsed.data, items: Object.fromEntries(Object.entries(parsed.data.items).filter(([id]) => dishes.some((d) => d.id === id && d.outletId === parsed.data.outletId))) });
    } } catch { /* Ignore invalid guest storage. */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded && !user && !loading) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Storage can be unavailable. */ } }
  }, [state, loaded, user, loading]);
  useEffect(() => {
    if (!loaded || loading) return;
    let active = true;
    setSyncedUser(null); setSyncError("");
    if (!user) {
      if (previousUser.current) { setState({ outletId: "main", items: {} }); localStorage.removeItem(KEY); }
      previousUser.current = null;
      return;
    }
    const guest = previousUser.current ? { outletId: "main" as const, items: {} } : stateRef.current;
    previousUser.current = user.id;
    void readCart().then((saved) => {
      if (!active) return;
      const merged = saved ? mergeCarts(saved, guest) : guest;
      setState(merged); setSyncedUser(user.id); localStorage.removeItem(KEY);
    }).catch(() => { if (active) setSyncError("Your saved cart couldn't be loaded. Refresh to try again."); });
    return () => { active = false; };
  }, [user?.id, loading, loaded, readCart]);
  useEffect(() => {
    if (!user || syncedUser !== user.id) return;
    let active = true;
    const timer = setTimeout(() => {
      saveQueue.current = saveQueue.current.then(async () => {
        if (!active) return;
        try { await writeRef.current({ data: state }); if (active) setSyncError(""); }
        catch { if (active) setSyncError("Your cart couldn't be saved. Your items are still here."); }
      });
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [state, user?.id, syncedUser]);

  const setQty = (id: string, q: number) => setState((s) => {
    const dish = dishes.find((d) => d.id === id);
    if (!Number.isFinite(q) || !dish || dish.outletId !== s.outletId || (q > (s.items[id] ?? 0) && !dish.available)) return s;
    const items = { ...s.items };
    const n = Math.max(0, Math.min(MAX_QTY, Math.floor(q)));
    if (n === 0) delete items[id]; else items[id] = n;
    return { ...s, items };
  });
  return (
    <CartCtx.Provider value={{ ...state,
      syncError, syncing: !!user && syncedUser !== user.id && !syncError,
      setOutlet: (outletId) => { if (outlets.some((o) => o.id === outletId)) setState({ outletId: outletId as CartState["outletId"], items: {} }); },
      add: (id) => setQty(id, (state.items[id] ?? 0) + 1), setQty,
      clear: () => setState((s) => ({ ...s, items: {} })) }}>
      {children}
    </CartCtx.Provider>
  );
}
export function useCart() { const c = useContext(CartCtx); if (!c) throw new Error("CartProvider missing"); return c; }
