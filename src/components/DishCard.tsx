import { Minus, Plus, Clock, Utensils } from "lucide-react";
import { formatINR, type Dish } from "@/lib/menu-data";
import { dishImage } from "@/lib/meal-images";
import { useCart, MAX_QTY } from "@/lib/cart";
import { DietBadge } from "./DietBadge";

export function DishCard({ dish, disabled }: { dish: Dish; disabled?: boolean }) {
  const { items, add, setQty } = useCart();
  const q = items[dish.id] ?? 0;
  const off = !dish.available || disabled;
  const photo = dishImage(dish.name);
  return (
    <article className="flex gap-3 rounded-2xl bg-card p-3 shadow-card sm:flex-col sm:p-0 sm:overflow-hidden">
      {photo ? <img src={photo} alt={dish.name} loading="lazy" width={512} height={512}
        className={`h-24 w-24 shrink-0 rounded-xl object-cover sm:h-auto sm:w-full sm:aspect-[4/3] sm:rounded-none ${!dish.available ? "grayscale" : ""}`} />
        : <div role="img" aria-label={`Photo unavailable for ${dish.name}`} className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground sm:aspect-[4/3] sm:h-auto sm:w-full sm:rounded-none"><Utensils className="h-8 w-8" aria-hidden /></div>}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:p-4 sm:pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <DietBadge diet={dish.diet} />
          {dish.popular && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">Popular</span>}
        </div>
        <h3 className="font-sans text-base font-semibold leading-tight">{dish.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{dish.description}</p>
        <p className="text-xs text-muted-foreground">
          <Clock className="mr-1 inline h-3 w-3" aria-hidden />~{dish.prepMins} min ·{" "}
          {dish.allergens === null ? "Allergens: not declared — ask staff" : dish.allergens.length ? `Contains: ${dish.allergens.join(", ")}` : "No common allergens declared"}
        </p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="font-semibold">{formatINR(dish.pricePaise)}</span>
          {!dish.available ? <span className="text-sm font-medium text-muted-foreground">Sold out</span>
          : q === 0 ? (
            <button disabled={off} onClick={() => add(dish.id)} aria-label={`Add ${dish.name}`}
              className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Add</button>
          ) : (
            <div className="flex items-center rounded-full border border-primary" role="group" aria-label={`${dish.name} quantity`}>
              <button className="grid h-11 w-11 place-items-center" onClick={() => setQty(dish.id, q - 1)} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
              <span className="w-6 text-center font-semibold" aria-live="polite">{q}</span>
              <button className="grid h-11 w-11 place-items-center disabled:opacity-40" disabled={q >= MAX_QTY} onClick={() => add(dish.id)} aria-label="Increase"><Plus className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
