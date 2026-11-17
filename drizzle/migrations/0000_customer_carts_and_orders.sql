CREATE TABLE public.carts (
 user_id uuid PRIMARY KEY,
 outlet_id text NOT NULL CHECK (outlet_id IN ('main','hostel')),
 items jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(items) = 'object'),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT ALL ON public.carts TO service_role;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_carts ON public.carts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TABLE public.orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 outlet_id text NOT NULL CHECK (outlet_id IN ('main','hostel')),
 fulfillment text NOT NULL DEFAULT 'pickup' CHECK (fulfillment = 'pickup'),
 status text NOT NULL DEFAULT 'awaiting_payment' CHECK (status IN ('awaiting_payment','confirmed','preparing','ready','completed','cancelled')),
 payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
 subtotal_paise integer NOT NULL CHECK (subtotal_paise >= 0),
 packaging_paise integer NOT NULL CHECK (packaging_paise >= 0),
 tax_paise integer NOT NULL DEFAULT 0 CHECK (tax_paise >= 0),
 total_paise integer NOT NULL CHECK (total_paise = subtotal_paise + packaging_paise + tax_paise),
 razorpay_order_id text UNIQUE,
 razorpay_payment_id text UNIQUE,
 idempotency_key uuid NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_own_orders ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX orders_customer_date ON public.orders(user_id, created_at DESC);
CREATE TABLE public.order_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
 dish_id text NOT NULL,
 dish_name text NOT NULL,
 quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 10),
 unit_price_paise integer NOT NULL CHECK (unit_price_paise >= 0)
);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_own_order_items ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE INDEX order_items_order ON public.order_items(order_id);