import { createContext, useContext, type ReactNode } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getCatalog } from "./catalog.functions";
import type { Dish, Outlet } from "./menu-data";

export const catalogOptions = {
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 15000,
  refetchInterval: 30000,
};
interface Catalog {
  dishes: Dish[];
  outlets: (Outlet & {
    acceptingOrders: boolean;
    counterPayments: boolean;
    taxBasisPoints: number;
  })[];
}
const CatalogContext = createContext<Catalog>({ dishes: [], outlets: [] });
export function CatalogProvider({ children }: { children: ReactNode }) {
  const { data } = useSuspenseQuery(catalogOptions);
  const dishes: Dish[] = data.dishes.map((d) => ({
    id: d.id,
    outletId: d.outlet_id,
    category: d.category as Dish["category"],
    name: d.name,
    description: d.description,
    pricePaise: d.price_paise,
    diet: d.diet as Dish["diet"],
    spice: d.spice as Dish["spice"],
    prepMins: d.prep_mins,
    allergens: d.allergens,
    available: d.available && d.stock > 0,
    popular: d.popular,
  }));
  const outlets = data.outlets.map((o) => ({
    id: o.id,
    name: o.name,
    location: o.location,
    opens: o.opens,
    closes: o.closes,
    acceptingOrders: o.accepting_orders,
    counterPayments: o.counter_payments,
    taxBasisPoints: o.tax_basis_points,
  }));
  return <CatalogContext.Provider value={{ dishes, outlets }}>{children}</CatalogContext.Provider>;
}
export const useCatalog = () => useContext(CatalogContext);
