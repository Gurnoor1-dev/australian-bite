alter table public.orders add column if not exists idempotency_key uuid;
create unique index if not exists orders_customer_idempotency_unique on public.orders(customer_id,idempotency_key) where idempotency_key is not null;

create or replace function public.place_order(
 p_items jsonb,p_contact_name text,p_contact_phone text,p_fulfillment_type text,
 p_address text,p_notes text,p_payment_method text,p_scheduled_for timestamptz,
 p_promo_code text,p_request_key uuid
) returns uuid
language plpgsql security definer set search_path to ''
as $function$
declare
 v_user uuid:=auth.uid();
 v_existing uuid;
 v_order_id uuid;
begin
 if v_user is null then raise exception 'Please sign in to place an order'; end if;
 if p_request_key is null then raise exception 'Refresh checkout and try again'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':' || p_request_key::text,0));
 select id into v_existing from public.orders where customer_id=v_user and idempotency_key=p_request_key;
 if v_existing is not null then return v_existing; end if;
 v_order_id:=public.place_order(p_items,p_contact_name,p_contact_phone,p_fulfillment_type,p_address,p_notes,p_payment_method,p_scheduled_for,p_promo_code);
 update public.orders set idempotency_key=p_request_key where id=v_order_id and customer_id=v_user;
 return v_order_id;
end;
$function$;
revoke all on function public.place_order(jsonb,text,text,text,text,text,text,timestamptz,text,uuid) from public,anon;
grant execute on function public.place_order(jsonb,text,text,text,text,text,text,timestamptz,text,uuid) to authenticated;