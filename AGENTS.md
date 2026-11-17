<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Money is integer paise everywhere; totals come from src/lib/pricing.ts (server must recompute before payment). Why: avoids float rounding and price tampering.
- The live catalog is read through catalog.functions.ts and shared by CatalogProvider; menu-data.ts holds image metadata and initial catalog reference only. Why: staff changes must reach every customer surface.
- Customer-private pages live under the client-only authenticated layout and customer functions use verified bearer middleware; route guards alone do not secure data.
- Keep one root auth listener and clear Query caches before sign-out; this prevents cross-account private data reuse.
- Guest carts use local storage, signed-in carts use owner-scoped Cloud rows, and merges use cart-rules.ts; this preserves the one-outlet and quantity invariants.
- Order writes and payment state transitions are server-only; customers receive read-only order access to prevent price and payment tampering.
- Database order procedures lock stock and orders and enforce idempotency; only verified server handlers may invoke them with service privileges. Why: concurrent checkout and cancellation must not oversell or double-restock.
- Staff permissions live in user_roles and are checked by every staff function; role assignment is an operator provisioning step, never a public signup option. Why: customers cannot elevate their access.
