ALTER TABLE public.outlets ADD CONSTRAINT online_only_outlets CHECK(counter_payments=false);
ALTER TABLE public.orders ADD CONSTRAINT online_only_orders CHECK(payment_method='razorpay') NOT VALID;
REVOKE EXECUTE ON FUNCTION public.place_counter_order(uuid,text,jsonb,uuid,text,integer,integer) FROM service_role;
COMMENT ON FUNCTION public.place_counter_order(uuid,text,jsonb,uuid,text,integer,integer) IS 'DEPRECATED: counter payments are not supported; execution revoked';
CREATE FUNCTION public.reject_manual_payment() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NEW.payment_status='paid' AND OLD.payment_status<>'paid' AND NEW.razorpay_payment_id IS NULL THEN RAISE EXCEPTION 'Online payment requires a verified provider reference'; END IF; RETURN NEW; END $$;
CREATE TRIGGER verified_payment_reference BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.reject_manual_payment();
CREATE FUNCTION public.sales_summary(p_outlet text,p_from timestamptz,p_to timestamptz) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator access required'; END IF;
IF p_from>=p_to OR p_to-p_from>interval '366 days' THEN RAISE EXCEPTION 'Invalid report range'; END IF;
SELECT jsonb_build_object('orders',count(*),'paid_orders',count(*) FILTER(WHERE payment_status='paid'),'collected_paise',coalesce(sum(total_paise) FILTER(WHERE payment_status='paid'),0),'cancelled',count(*) FILTER(WHERE status='cancelled'),'refunded_paise',coalesce(sum(total_paise) FILTER(WHERE payment_status='refunded'),0)) INTO result FROM public.orders WHERE outlet_id=p_outlet AND created_at>=p_from AND created_at<p_to;
RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.sales_summary(text,timestamptz,timestamptz) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.sales_summary(text,timestamptz,timestamptz) TO authenticated;