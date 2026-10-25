alter table public.store_settings add column if not exists delivery_postal_codes text[] not null default '{}';
alter table public.orders add column if not exists postal_code text;
create index if not exists referral_rewards_referrer_idx on public.referral_rewards(referrer_id);
create index if not exists referral_codes_referred_by_idx on public.referral_codes(referred_by);
create index if not exists order_reviews_customer_idx on public.order_reviews(customer_id);
create index if not exists loyalty_transactions_order_idx on public.loyalty_transactions(order_id);
create index if not exists order_items_menu_item_idx on public.order_items(menu_item_id);

create or replace function public.place_order(
 p_items jsonb,p_contact_name text,p_contact_phone text,p_fulfillment_type text,
 p_address text,p_notes text,p_payment_method text,p_scheduled_for timestamptz,
 p_promo_code text,p_request_key uuid,p_postal_code text
) returns uuid
language plpgsql security definer set search_path to ''
as $function$
declare
 v_user uuid:=auth.uid(); v_existing uuid; v_order_id uuid; v_allowed text[];
begin
 if v_user is null then raise exception 'Please sign in to place an order'; end if;
 if p_request_key is null then raise exception 'Refresh checkout and try again'; end if;
 if p_fulfillment_type='delivery' then
  if coalesce(trim(p_postal_code),'') !~ '^[0-9]{6}$' then raise exception 'Enter a valid 6-digit PIN code'; end if;
  select delivery_postal_codes into v_allowed from public.store_settings where id=1;
  if coalesce(cardinality(v_allowed),0)>0 and not (trim(p_postal_code)=any(v_allowed)) then
   raise exception 'Delivery is not available to this PIN code yet. Choose pickup or contact the store.';
  end if;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':' || p_request_key::text,0));
 select id into v_existing from public.orders where customer_id=v_user and idempotency_key=p_request_key;
 if v_existing is not null then return v_existing; end if;
 v_order_id:=public.place_order(p_items,p_contact_name,p_contact_phone,p_fulfillment_type,p_address,p_notes,p_payment_method,p_scheduled_for,p_promo_code);
 update public.orders set idempotency_key=p_request_key,postal_code=case when p_fulfillment_type='delivery' then trim(p_postal_code) else null end
 where id=v_order_id and customer_id=v_user;
 return v_order_id;
end;
$function$;
revoke all on function public.place_order(jsonb,text,text,text,text,text,text,timestamptz,text,uuid,text) from public,anon;
grant execute on function public.place_order(jsonb,text,text,text,text,text,text,timestamptz,text,uuid,text) to authenticated;