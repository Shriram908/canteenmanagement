CREATE TYPE public.app_role AS ENUM ('admin','kitchen');
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,role public.app_role NOT NULL, UNIQUE(user_id,role));
GRANT SELECT ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_roles ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated,service_role;
CREATE TABLE public.outlets (id text PRIMARY KEY CHECK(id IN ('main','hostel')),name text NOT NULL,location text NOT NULL,opens text NOT NULL CHECK(opens ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),closes text NOT NULL CHECK(closes ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),accepting_orders boolean NOT NULL DEFAULT true,counter_payments boolean NOT NULL DEFAULT false,tax_basis_points integer NOT NULL DEFAULT 0 CHECK(tax_basis_points BETWEEN 0 AND 10000));
GRANT SELECT ON public.outlets TO anon,authenticated; GRANT ALL ON public.outlets TO service_role;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY; CREATE POLICY public_outlets ON public.outlets FOR SELECT TO anon,authenticated USING(true);
CREATE TABLE public.dishes (id text PRIMARY KEY,outlet_id text NOT NULL REFERENCES public.outlets(id),category text NOT NULL CHECK(category IN ('breakfast','main','breads','soups','beverages','desserts')),name text NOT NULL,description text NOT NULL DEFAULT '',price_paise integer NOT NULL CHECK(price_paise BETWEEN 1 AND 1000000),diet text NOT NULL CHECK(diet IN ('veg','vegan','nonveg','egg')),spice integer NOT NULL DEFAULT 0 CHECK(spice BETWEEN 0 AND 3),prep_mins integer NOT NULL DEFAULT 10 CHECK(prep_mins BETWEEN 1 AND 180),allergens text[],available boolean NOT NULL DEFAULT true,popular boolean NOT NULL DEFAULT false,stock integer NOT NULL DEFAULT 0 CHECK(stock>=0));
GRANT SELECT ON public.dishes TO anon,authenticated; GRANT ALL ON public.dishes TO service_role;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY; CREATE POLICY public_dishes ON public.dishes FOR SELECT TO anon,authenticated USING(true);
ALTER TABLE public.orders ADD COLUMN payment_method text NOT NULL DEFAULT 'razorpay' CHECK(payment_method IN ('razorpay','counter')),ADD COLUMN notes text NOT NULL DEFAULT '',ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE public.order_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES public.orders(id),actor_id uuid NOT NULL,event text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.order_events TO authenticated; GRANT ALL ON public.order_events TO service_role;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY event_reads ON public.order_events FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.orders WHERE id=order_id AND user_id=auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kitchen'));
CREATE POLICY staff_orders ON public.orders FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kitchen'));
CREATE POLICY staff_items ON public.order_items FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kitchen'));
CREATE INDEX orders_kitchen ON public.orders(outlet_id,status,created_at);
CREATE FUNCTION public.place_counter_order(p_user uuid,p_outlet text,p_items jsonb,p_key uuid,p_notes text,p_total integer,p_packaging integer) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.outlets; d public.dishes; x record; v_id uuid; v_sub integer:=0; v_count integer:=0; v_tax integer; v_time text;
BEGIN
PERFORM pg_advisory_xact_lock(hashtextextended(p_key::text,0));
SELECT id INTO v_id FROM public.orders WHERE idempotency_key=p_key AND user_id=p_user; IF v_id IS NOT NULL THEN RETURN v_id; END IF;
SELECT * INTO o FROM public.outlets WHERE id=p_outlet FOR UPDATE;
v_time:=to_char(now() AT TIME ZONE 'Asia/Kolkata','HH24:MI');
IF o.id IS NULL OR NOT o.accepting_orders OR NOT o.counter_payments OR NOT (CASE WHEN o.opens<o.closes THEN v_time>=o.opens AND v_time<o.closes ELSE v_time>=o.opens OR v_time<o.closes END) THEN RAISE EXCEPTION 'Outlet is closed or counter payments are unavailable'; END IF;
IF jsonb_typeof(p_items)<>'object' OR p_items='{}'::jsonb OR length(p_notes)>300 THEN RAISE EXCEPTION 'Invalid order'; END IF;
FOR x IN SELECT key,value FROM jsonb_each_text(p_items) ORDER BY key LOOP
IF x.value !~ '^[0-9]+$' OR x.value::integer NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
SELECT * INTO d FROM public.dishes WHERE id=x.key AND outlet_id=p_outlet FOR UPDATE;
IF d.id IS NULL OR NOT d.available OR d.stock<x.value::integer THEN RAISE EXCEPTION 'Dish is sold out or insufficient stock'; END IF;
v_sub:=v_sub+d.price_paise*x.value::integer; v_count:=v_count+x.value::integer;
END LOOP;
v_tax:=round(v_sub::numeric*o.tax_basis_points/10000)::integer;
IF p_packaging<>v_count*500 OR p_total<>v_sub+p_packaging+v_tax THEN RAISE EXCEPTION 'Prices changed. Refresh your cart'; END IF;
INSERT INTO public.orders(user_id,outlet_id,idempotency_key,status,payment_status,payment_method,notes,subtotal_paise,packaging_paise,tax_paise,total_paise) VALUES(p_user,p_outlet,p_key,'confirmed','pending','counter',p_notes,v_sub,p_packaging,v_tax,p_total) RETURNING id INTO v_id;
FOR x IN SELECT key,value FROM jsonb_each_text(p_items) ORDER BY key LOOP
SELECT * INTO d FROM public.dishes WHERE id=x.key;
INSERT INTO public.order_items(order_id,dish_id,dish_name,quantity,unit_price_paise) VALUES(v_id,d.id,d.name,x.value::integer,d.price_paise);
UPDATE public.dishes SET stock=stock-x.value::integer WHERE id=d.id;
END LOOP;
INSERT INTO public.order_events(order_id,actor_id,event) VALUES(v_id,p_user,'Order confirmed');
RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.place_counter_order(uuid,text,jsonb,uuid,text,integer,integer) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.place_counter_order(uuid,text,jsonb,uuid,text,integer,integer) TO service_role;
CREATE FUNCTION public.change_order(p_user uuid,p_order uuid,p_action text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders; staff boolean; x record;
BEGIN
SELECT * INTO o FROM public.orders WHERE id=p_order FOR UPDATE; IF o.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
staff:=public.has_role(p_user,'admin') OR public.has_role(p_user,'kitchen');
IF p_action='cancelled' THEN
IF (NOT staff AND o.user_id<>p_user) OR o.status<>'confirmed' OR o.payment_status='paid' THEN RAISE EXCEPTION 'This order cannot be cancelled'; END IF;
FOR x IN SELECT dish_id,quantity FROM public.order_items WHERE order_id=p_order ORDER BY dish_id LOOP UPDATE public.dishes SET stock=stock+x.quantity WHERE id=x.dish_id; END LOOP;
ELSIF p_action='paid' THEN
IF NOT staff OR o.payment_method<>'counter' OR o.payment_status<>'pending' OR o.status='cancelled' THEN RAISE EXCEPTION 'Cannot collect this payment'; END IF;
UPDATE public.orders SET payment_status='paid',updated_at=now() WHERE id=p_order;
ELSE
IF NOT staff OR NOT ((o.status='confirmed' AND p_action='preparing') OR (o.status='preparing' AND p_action='ready') OR (o.status='ready' AND p_action='completed' AND o.payment_status='paid')) THEN RAISE EXCEPTION 'Invalid order transition or payment is unpaid'; END IF;
END IF;
IF p_action<>'paid' THEN UPDATE public.orders SET status=p_action,updated_at=now() WHERE id=p_order; END IF;
INSERT INTO public.order_events(order_id,actor_id,event) VALUES(p_order,p_user,p_action);
END $$;
REVOKE ALL ON FUNCTION public.change_order(uuid,uuid,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.change_order(uuid,uuid,text) TO service_role;