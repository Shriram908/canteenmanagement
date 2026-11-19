import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { catalogOptions } from "@/lib/catalog";
import { useSuspenseQuery } from "@tanstack/react-query";
import { saveDish, saveOutlet } from "@/lib/staff.functions";
import { categories, formatINR } from "@/lib/menu-data";
import { Button } from "./ui/button";
import type { Tables } from "@/integrations/supabase/types";
import { Plus, Pencil, Save, Search, Utensils } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { dishImage } from "@/lib/meal-images";
import { dishInput, outletInput, stockStatus, type StockStatus } from "@/lib/admin-rules";

const field = "mt-1 min-h-11 w-full rounded-md border bg-background px-3";
export function CatalogEditor({ outlet }: { outlet: "main" | "hostel" }) {
  const { data } = useSuspenseQuery(catalogOptions);
  const [draft, setDraft] = useState<Tables<"dishes"> | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<StockStatus | "all">("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const write = useServerFn(saveDish);
  const client = useQueryClient();
  function add() {
    setDraft({
      id: `${outlet}-${crypto.randomUUID()}`,
      outlet_id: outlet,
      name: "",
      description: "",
      category: "main",
      price_paise: 10000,
      diet: "veg",
      spice: 0,
      prep_mins: 10,
      allergens: null,
      available: true,
      popular: false,
      stock: 0,
    });
    setError("");
    setMessage("");
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      await write({ data: dishInput.parse(draft) });
      await client.invalidateQueries({ queryKey: ["catalog"] });
      setDraft(null);
      setMessage("Dish saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save dish.");
    } finally {
      setBusy(false);
    }
  }
  const dishes = data.dishes.filter(
    (d) => d.outlet_id === outlet && d.name.toLowerCase().includes(search.trim().toLowerCase())
      && (category === "all" || d.category === category)
      && (status === "all" || stockStatus(d) === status),
  );
  return (
    <section>
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-40 flex-1">
        <Search aria-hidden className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
        <input
          aria-label="Find a dish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find a dish…"
          className="min-h-11 w-full rounded-md border bg-card pl-10 pr-3"
        />
        </div>
        <select aria-label="Filter category" value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-11 max-w-full rounded-md border bg-card px-3 text-sm">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select aria-label="Filter stock status" value={status} onChange={(e) => setStatus(e.target.value as StockStatus | "all")} className="min-h-11 rounded-md border bg-card px-3 text-sm">
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="sold-out">Sold out</option>
          <option value="unlisted">Unlisted</option>
        </select>
        <Button onClick={add}>
          <Plus />
          Add dish
        </Button>
      </div>
      {message && (
        <p role="status" className="mb-3 text-veg">
          {message}
        </p>
      )}
      {error && !draft && (
        <p role="alert" className="mb-3 text-destructive">
          {error}
        </p>
      )}
      <Dialog open={!!draft} onOpenChange={(open) => { if (!open && !busy) setDraft(null); }}>
      {draft && (
        <DialogContent aria-describedby={undefined} className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-lg">
        <DialogHeader><DialogTitle>{draft.name || "New dish"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => void submit(e)}>
        <fieldset disabled={busy}>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm">
              Name
              <input
                required
                maxLength={100}
                className={field}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Price (₹)
              <input
                required
                type="number"
                min="0.01"
                max="10000"
                step="0.01"
                className={field}
                value={draft.price_paise / 100}
                onChange={(e) =>
                  setDraft({ ...draft, price_paise: Math.round(Number(e.target.value) * 100) })
                }
              />
            </label>
            <label className="text-sm">
              Stock portions
              <input
                required
                type="number"
                min="0"
                max="100000"
                step="1"
                className={field}
                value={draft.stock}
                onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm">
              Category
              <select
                className={field}
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Diet
              <select
                className={field}
                value={draft.diet}
                onChange={(e) => setDraft({ ...draft, diet: e.target.value })}
              >
                {["veg", "vegan", "nonveg", "egg"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Preparation (minutes)
              <input
                required
                type="number"
                min="1"
                max="180"
                step="1"
                className={field}
                value={draft.prep_mins}
                onChange={(e) => setDraft({ ...draft, prep_mins: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm">
              Spice
              <select
                className={field}
                value={draft.spice}
                onChange={(e) => setDraft({ ...draft, spice: Number(e.target.value) })}
              >
                {[0, 1, 2, 3].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              Description
              <textarea
                maxLength={500}
                className={`${field} py-3`}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Allergens (comma separated)
              <input
                className={field}
                value={draft.allergens?.join(", ") ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    allergens: e.target.value.trim()
                      ? e.target.value
                          .split(",")
                          .map((v) => v.trim())
                          .filter(Boolean)
                      : null,
                  })
                }
              />
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.available}
                  onChange={(e) => setDraft({ ...draft, available: e.target.checked })}
                />
                Listed
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.popular}
                  onChange={(e) => setDraft({ ...draft, popular: e.target.checked })}
                />
                Popular
              </label>
            </div>
          </div>
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => setDraft(null)}>Cancel</Button>
          <Button disabled={busy} type="submit">
            <Save />
            {busy ? "Saving…" : "Save dish"}
          </Button>
          </div>
        </fieldset>
        </form>
        </DialogContent>
      )}
      </Dialog>
      <p className="mb-3 text-xs text-muted-foreground">{dishes.length} dishes</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-muted-foreground">
            <tr>
              <th className="py-3">Dish</th>
              <th className="px-3">Price</th>
              <th className="px-3">Stock</th>
              <th className="px-3">Status</th>
              <th>
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {dishes.map((d) => (
              <tr key={d.id} className="border-b">
                <td className="min-w-44 py-4">
                  <div className="flex items-center gap-3">
                    {dishImage(d.name) ? <img src={dishImage(d.name)} alt={d.name} className="size-12 shrink-0 rounded-md object-cover" loading="lazy" /> : <span className="grid size-12 shrink-0 place-items-center rounded-md bg-muted"><Utensils className="size-5 text-muted-foreground" /></span>}
                    <div><span className="font-medium">{d.name}</span><p className="mt-1 text-xs text-muted-foreground">{categories.find((c) => c.id === d.category)?.label}</p></div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3">{formatINR(d.price_paise)}</td>
                <td className="px-3">{d.stock}</td>
                <td className={`whitespace-nowrap px-3 ${stockStatus(d) === "available" ? "text-veg" : "text-muted-foreground"}`}>
                  {stockStatus(d) === "available" ? "Available" : stockStatus(d) === "unlisted" ? "Unlisted" : "Sold out"}
                </td>
                <td>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${d.name}`}
                    onClick={() => {
                      setDraft(d);
                      setMessage("");
                      setError("");
                    }}
                  >
                    <Pencil />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!dishes.length && <div className="border-b py-12 text-center"><Search className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 font-medium">No matching dishes</p><Button variant="ghost" className="mt-2" onClick={() => { setSearch(""); setCategory("all"); setStatus("all"); }}>Clear filters</Button></div>}
    </section>
  );
}

export function OutletEditor({ outlet }: { outlet: "main" | "hostel" }) {
  const { data } = useSuspenseQuery(catalogOptions);
  const initial = data.outlets.find((o) => o.id === outlet);
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const write = useServerFn(saveOutlet);
  const client = useQueryClient();
  if (!draft) return <p>Outlet not found.</p>;
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      await write({ data: outletInput.parse({ ...draft, id: outlet, counter_payments: false }) });
      await client.invalidateQueries({ queryKey: ["catalog"] });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settings could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={(e) => void submit(e)} className="max-w-2xl">
      <fieldset disabled={busy} onChange={() => setSaved(false)} className="space-y-5">
      <h2 className="text-xl font-semibold">Outlet settings</h2>
      <label className="block text-sm">
        Name
        <input
          required
          className={field}
          maxLength={100}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Pickup location
        <input
          required
          maxLength={200}
          className={field}
          value={draft.location}
          onChange={(e) => setDraft({ ...draft, location: e.target.value })}
        />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm">
          Opens (IST)
          <input
            required
            type="time"
            className={field}
            value={draft.opens}
            onChange={(e) => setDraft({ ...draft, opens: e.target.value })}
          />
        </label>
        <label className="text-sm">
          Closes (IST)
          <input
            required
            type="time"
            className={field}
            value={draft.closes}
            onChange={(e) => setDraft({ ...draft, closes: e.target.value })}
          />
        </label>
      </div>
      <label className="block text-sm">
        Tax (%)
        <input
          required
          type="number"
          min="0"
          max="100"
          step="0.01"
          className={field}
          value={draft.tax_basis_points / 100}
          onChange={(e) =>
            setDraft({ ...draft, tax_basis_points: Math.round(Number(e.target.value) * 100) })
          }
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.accepting_orders}
          onChange={(e) => setDraft({ ...draft, accepting_orders: e.target.checked })}
        />
        Accept orders during opening hours
      </label>
      <p className="text-sm text-muted-foreground">
        Online payments only · Razorpay test mode
      </p>
      <Button disabled={busy} type="submit">
        <Save />
        {busy ? "Saving…" : "Save settings"}
      </Button>
      </fieldset>
      {saved && (
        <p role="status" className="text-veg">
          Settings saved.
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
