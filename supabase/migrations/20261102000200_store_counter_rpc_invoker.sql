create or replace function public.place_counter_order(
 p_items jsonb,p_contact_name text,p_contact_phone text,p_fulfillment_type text default 'pickup',
 p_address text default null,p_notes text default null,p_payment_method text default 'cod',
 p_scheduled_for timestamptz default null,p_promo_code text default null,p_request_key uuid default null,p_postal_code text default null
) returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_order_id uuid; v_existing uuid;
begin
 if v_user is null or not private.has_any_role(array['store','admin']::public.app_role[]) then raise exception 'Store access required'; end if;
 if p_request_key is null then raise exception 'A request key is required'; end if;
 select id into v_existing from public.orders where customer_id=v_user and idempotency_key=p_request_key;
 if v_existing is not null then
  if not exists(select 1 from public.orders where id=v_existing and order_source='counter') then raise exception 'This request key was already used for another order'; end if;
  return v_existing;
 end if;
 v_order_id:=public.place_order(p_items,p_contact_name,p_contact_phone,p_fulfillment_type,p_address,p_notes,p_payment_method,p_scheduled_for,p_promo_code,p_request_key,p_postal_code);
 update public.orders set order_source='counter',created_by=v_user where id=v_order_id and customer_id=v_user;
 return v_order_id;
end;
$$;
revoke all on function public.place_counter_order(jsonb,text,text,text,text,text,text,timestamptz,text,uuid,text) from public,anon;
grant execute on function public.place_counter_order(jsonb,text,text,text,text,text,text,timestamptz,text,uuid,text) to authenticated;