ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'test' CHECK (payment_mode IN ('test','live'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_creation_started boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reservation_expires_at timestamptz;
CREATE OR REPLACE FUNCTION public.reserve_test_order(p_user uuid,p_outlet text,p_items jsonb,p_key uuid,p_notes text,p_total integer,p_packaging integer) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.outlets; d public.dishes; x record; v_id uuid; v_sub integer:=0; v_count integer:=0; v_tax integer; v_time text;
BEGIN
PERFORM pg_advisory_xact_lock(hashtextextended(p_key::text,0));
SELECT id INTO v_id FROM public.orders WHERE idempotency_key=p_key AND user_id=p_user;
IF v_id IS NOT NULL THEN RETURN v_id; END IF;
SELECT * INTO o FROM public.outlets WHERE id=p_outlet FOR UPDATE;
v_time:=to_char(now() AT TIME ZONE 'Asia/Kolkata','HH24:MI');
IF o.id IS NULL OR NOT o.accepting_orders OR NOT (CASE WHEN o.opens<o.closes THEN v_time>=o.opens AND v_time<o.closes ELSE v_time>=o.opens OR v_time<o.closes END) THEN RAISE EXCEPTION 'Outlet is closed for orders'; END IF;
IF jsonb_typeof(p_items)<>'object' OR p_items='{}'::jsonb OR length(p_notes)>300 OR (SELECT count(*) FROM jsonb_each(p_items))>100 THEN RAISE EXCEPTION 'Invalid order'; END IF;
FOR x IN SELECT key,value FROM jsonb_each_text(p_items) ORDER BY key LOOP
IF x.value !~ '^[0-9]+$' OR x.value::integer NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
SELECT * INTO d FROM public.dishes WHERE id=x.key AND outlet_id=p_outlet FOR UPDATE;
IF d.id IS NULL OR NOT d.available OR d.stock<x.value::integer THEN RAISE EXCEPTION 'Dish is sold out or insufficient stock'; END IF;
v_sub:=v_sub+d.price_paise*x.value::integer; v_count:=v_count+x.value::integer;
END LOOP;
v_tax:=round(v_sub::numeric*o.tax_basis_points/10000)::integer;
IF p_packaging<>v_count*500 OR p_total<>v_sub+p_packaging+v_tax THEN RAISE EXCEPTION 'Prices changed. Refresh your cart'; END IF;
INSERT INTO public.orders(user_id,outlet_id,idempotency_key,status,payment_status,payment_method,payment_mode,notes,subtotal_paise,packaging_paise,tax_paise,total_paise,reservation_expires_at) VALUES(p_user,p_outlet,p_key,'awaiting_payment','pending','razorpay','test',p_notes,v_sub,p_packaging,v_tax,p_total,now()+interval '15 minutes') RETURNING id INTO v_id;
FOR x IN SELECT key,value FROM jsonb_each_text(p_items) ORDER BY key LOOP
SELECT * INTO d FROM public.dishes WHERE id=x.key;
INSERT INTO public.order_items(order_id,dish_id,dish_name,quantity,unit_price_paise) VALUES(v_id,d.id,d.name,x.value::integer,d.price_paise);
UPDATE public.dishes SET stock=stock-x.value::integer WHERE id=d.id;
END LOOP;
INSERT INTO public.order_events(order_id,actor_id,event) VALUES(v_id,p_user,'Test payment stock reserved');
RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.reserve_test_order(uuid,text,jsonb,uuid,text,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_test_order(uuid,text,jsonb,uuid,text,integer,integer) TO service_role;
CREATE OR REPLACE FUNCTION public.claim_test_payment(p_user uuid,p_order uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
UPDATE public.orders SET payment_creation_started=true WHERE id=p_order AND user_id=p_user AND payment_mode='test' AND status='awaiting_payment' AND NOT payment_creation_started AND razorpay_order_id IS NULL;
RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.claim_test_payment(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_test_payment(uuid,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.confirm_test_payment(p_user uuid,p_order uuid,p_provider_order text,p_payment text,p_amount integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders;
BEGIN
SELECT * INTO o FROM public.orders WHERE id=p_order AND user_id=p_user FOR UPDATE;
IF o.id IS NULL OR o.payment_mode<>'test' OR o.razorpay_order_id IS DISTINCT FROM p_provider_order OR o.total_paise<>p_amount THEN RAISE EXCEPTION 'Payment does not match this order'; END IF;
IF o.payment_status='paid' THEN IF o.razorpay_payment_id IS DISTINCT FROM p_payment THEN RAISE EXCEPTION 'Payment already recorded'; END IF; RETURN; END IF;
IF o.status<>'awaiting_payment' THEN RAISE EXCEPTION 'Order is not awaiting payment'; END IF;
UPDATE public.orders SET payment_status='paid',status='confirmed',razorpay_payment_id=p_payment,updated_at=now() WHERE id=p_order;
INSERT INTO public.order_events(order_id,actor_id,event) VALUES(p_order,p_user,'Razorpay test payment verified');
END $$;
REVOKE ALL ON FUNCTION public.confirm_test_payment(uuid,uuid,text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_test_payment(uuid,uuid,text,text,integer) TO service_role;