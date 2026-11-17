# Food Book

Campus canteen ordering in INR and Asia/Kolkata, built with React, TanStack Start, Tailwind and Lovable Cloud.

## Development and tests

```sh
bun install
bun run dev
bun run test
```

Cloud provisions runtime credentials; never commit private credentials. Schema changes use Lovable's database migration tool.

## Customer accounts

- Email/password signup requires email confirmation. Google and Lovable sign-in are enabled.
- `/auth` provides signup, sign-in and reset-link requests; `/reset-password` accepts recovery links.
- `/profile` and `/orders` are protected pages under the authenticated layout. Profile editing stores a display name only.
- Sign-out cancels queries and clears cached private data before clearing the session.

## Schema and boundaries

- `profiles`: auth-linked profile, automatically created on signup; owner-only read/update.
- `carts`: one row per customer, owner-only CRUD; guest carts remain local until sign-in.
- `orders`: outlet, pickup fulfillment, integer-paise totals, status, payment references and unique idempotency key; owner-only read, server-only writes.
- `order_items`: immutable dish-name and unit-price snapshots with quantities 1–10; owner-only read through the parent order.
- Customer server functions validate inputs and use verified bearer middleware. RLS and explicit grants protect database access independently of page guards.
- Live menu data comes from Cloud `outlets` and `dishes`, shared through `CatalogProvider` with 30-second refresh. `menu-data.ts` contains initial reference data and image/category helpers only. Pricing comes from `src/lib/pricing.ts`; future payment creation must recompute totals from the live database, never client amounts.
- Guest and saved carts merge only within one outlet, capped at ten per dish. A guest cart from another outlet replaces the saved cart rather than mixing outlets.

## Current limitations / external setup

- Razorpay is not connected. Checkout is explicitly unavailable and never reports fake payment success.
- Connect Razorpay Test mode with the secure connection form, using the Key ID as username and Key Secret as password from Razorpay Account & Settings → API Keys.
- `/checkout` provides pickup and total review; payment submission is deliberately disabled. Online order creation/reservations, capture verification/webhooks, reconciliation, refunds, optional delivery and outbound notifications remain unimplemented. This is not ready to accept real orders yet.
- `/admin` includes dish creation/editing, prices, allergens, stock, availability, outlet hours, tax settings, paginated order records, CSV page exports and date-filtered sales totals. `/kitchen` provides a refreshed order queue and validated preparation/ready/collection actions.
- Staff accounts require explicit `admin` or `kitchen` rows in `public.user_roles`. No administrator was assigned because the owner declined to select an account. No role can be granted through public signup. Provision an approved existing account through Lovable Cloud; do not use user metadata or browser storage for roles.
- Catalog stock starts at zero intentionally: enter actual inventory, review existing sample names/prices and hours, and confirm the correct tax rate before launch. No fabricated orders or sales are inserted.
- Online-only payment rules are enforced in the database and server functions. The unused counter-order procedure has execution revoked for all app callers. Staff cannot manually mark a payment paid. Paid provider references are required, and unpaid orders cannot enter fulfillment.
- Order mutations are serialized in database procedures with stock restoration and an audit log; payment integration must add verified online reservation/capture procedures before enabling checkout.
- No orders are seeded or created without a payment flow. The order history reads real saved rows and shows an honest empty state.
- Password recovery and social provider round-trips need external email/provider interaction for full end-to-end verification.

## Tests

`src/test/pricing.test.ts` covers integer totals, packaging and tax rounding. `src/test/cart-rules.test.ts` covers one outlet, sold-out/unknown dishes, quantity bounds, trusted prices and cart merge behavior. `src/test/app-routing.test.tsx` covers home route registration.

Verification: all 10 unit tests passed. Browser checks passed email sign-in with a dedicated confirmed QA account, profile save/readback, guest-cart merge, saved-cart reload, private empty order history and sign-out access blocking. Phone cart at 390px had no horizontal overflow; no browser page errors were observed. Public signup was checked for rejection of reserved email domains; confirmation-email delivery and social sign-in round-trips remain unverified.

Final customer review covered Home, Menu, Cart, Profile, Orders, recovery, signup and forgot-password screens at 1280px desktop and 390px phone widths in the app's light theme (there is no theme switch). Two different cart items were changed, reloaded and removed, with both changes and removals persisting. Recovery's retry link now opens the reset-request form even for an already signed-in customer; empty carts show loading/failure states rather than silently hiding them.

## Latest verification and launch gate

- 14 tests pass, including lifecycle, integer-paise checkout validation and overnight IST opening hours.
- Browser verification against a real signed-in customer confirmed profile, order history and checkout load; ordinary customers see access-denied on `/admin` and `/kitchen`, and signed-out staff URLs redirect to sign-in. Menu search returns the live catalog (33 dishes per outlet). Phone pages had no horizontal overflow or page errors.
- Expanded review covered every public/customer page at 1280px desktop and 390px phone widths, checking all 33 menu cards and lazy-loaded images, search, a nonempty guest cart leading to sign-in, and staff access-denied links returning to the account page. The same checks also ran with the CSS dark class applied manually (there is no user theme selector). No page errors or horizontal overflow were observed. Signed-in checkout remained empty; paid checkout and authorized staff views were not exercised.
- Database verification confirmed 66 catalog rows, RLS on orders, zero staff assignments and no executable counter-order access for authenticated or service-role callers.
- Authorized staff editing and customer-to-payment-to-kitchen completion are **not verified**: no approved staff account and no Razorpay connection are available. Do not advertise production readiness from public/empty-page checks.
- Before publishing for customers: assign and verify operator access, configure real inventory, connect Razorpay test credentials, implement and test capture/webhook deduplication, reservations/expiry and refunds, then use live credentials and verify a small real transaction. Set business policies, taxes, campus pickup details and support contact; review security findings, backup/restore and monitoring.
- No deployment was performed in this change; publishing without completing the payment gate would expose a catalog but cannot accept orders.
