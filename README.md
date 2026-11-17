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
- Menu data remains in `src/lib/menu-data.ts`; pricing comes from `src/lib/pricing.ts`. Payment creation must recompute totals from trusted menu data, never client amounts.
- Guest and saved carts merge only within one outlet, capped at ten per dish. A guest cart from another outlet replaces the saved cart rather than mixing outlets.

## Current limitations / external setup

- Razorpay is not connected. Checkout is explicitly unavailable and never reports fake payment success.
- Connect Razorpay Test mode with the secure connection form, using the Key ID as username and Key Secret as password from Razorpay Account & Settings → API Keys.
- Checkout/reservations, payment capture verification/webhooks, kitchen/admin dashboards, refunds, reports and notifications remain unimplemented.
- No orders are seeded or created without a payment flow. The order history reads real saved rows and shows an honest empty state.
- Password recovery and social provider round-trips need external email/provider interaction for full end-to-end verification.

## Tests

`src/test/pricing.test.ts` covers integer totals, packaging and tax rounding. `src/test/cart-rules.test.ts` covers one outlet, sold-out/unknown dishes, quantity bounds, trusted prices and cart merge behavior. `src/test/app-routing.test.tsx` covers home route registration.

Verification: all 10 unit tests passed. Browser checks passed email sign-in with a dedicated confirmed QA account, profile save/readback, guest-cart merge, saved-cart reload, private empty order history and sign-out access blocking. Phone cart at 390px had no horizontal overflow; no browser page errors were observed. Public signup was checked for rejection of reserved email domains; confirmation-email delivery and social sign-in round-trips remain unverified.
