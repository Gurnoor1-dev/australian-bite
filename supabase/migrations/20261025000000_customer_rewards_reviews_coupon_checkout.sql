alter table public.orders add column if not exists coupon_code text;
create table if not exists public.promo_redemptions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 order_id uuid not null unique references public.orders(id) on delete cascade, code text not null,
 discount_amount integer not null check(discount_amount>=0), created_at timestamptz not null default now(), unique(user_id,code)
);
alter table public.promo_redemptions enable row level security;
drop policy if exists "Customers read own promo redemptions" on public.promo_redemptions;
create policy "Customers read own promo redemptions" on public.promo_redemptions for select to authenticated using(user_id=(select auth.uid()));
create table if not exists public.loyalty_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade, points_balance integer not null default 0 check(points_balance>=0),
 lifetime_points integer not null default 0 check(lifetime_points>=0), updated_at timestamptz not null default now()
);
alter table public.loyalty_accounts enable row level security;
drop policy if exists "Customers read own loyalty account" on public.loyalty_accounts;
create policy "Customers read own loyalty account" on public.loyalty_accounts for select to authenticated using(user_id=(select auth.uid()));
create table if not exists public.loyalty_transactions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 order_id uuid references public.orders(id) on delete set null, points integer not null, reason text not null, created_at timestamptz not null default now()
);
create unique index if not exists loyalty_transactions_order_award_unique on public.loyalty_transactions(order_id) where order_id is not null and points>0;
alter table public.loyalty_transactions enable row level security;
drop policy if exists "Customers read own loyalty transactions" on public.loyalty_transactions;
create policy "Customers read own loyalty transactions" on public.loyalty_transactions for select to authenticated using(user_id=(select auth.uid()));
create table if not exists public.order_reviews (
 id uuid primary key default gen_random_uuid(), order_id uuid not null unique references public.orders(id) on delete cascade,
 customer_id uuid not null references auth.users(id) on delete cascade, rating integer not null check(rating between 1 and 5),
 review_text text check(review_text is null or char_length(review_text)<=1200), is_published boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.order_reviews enable row level security;
drop policy if exists "Customers read published reviews" on public.order_reviews;
create policy "Customers read published reviews" on public.order_reviews for select to anon,authenticated using(is_published=true or customer_id=(select auth.uid()));
drop policy if exists "Customers review own completed orders" on public.order_reviews;
create policy "Customers review own completed orders" on public.order_reviews for insert to authenticated with check(
 customer_id=(select auth.uid()) and exists(select 1 from public.orders o where o.id=order_id and o.customer_id=(select auth.uid()) and o.status='completed')
);
create or replace function public.award_loyalty_points_on_completion()
returns trigger language plpgsql security definer set search_path to ''
as $function$
declare v_points integer;
begin
 if new.status='completed' and old.status is distinct from 'completed' then
  v_points:=greatest(0,floor(coalesce(new.subtotal,0)::numeric/100)::integer);
  if v_points>0 then
   insert into public.loyalty_accounts(user_id,points_balance,lifetime_points,updated_at) values(new.customer_id,v_points,v_points,now())
   on conflict(user_id) do update set points_balance=public.loyalty_accounts.points_balance+excluded.points_balance,
    lifetime_points=public.loyalty_accounts.lifetime_points+excluded.lifetime_points,updated_at=now();
   insert into public.loyalty_transactions(user_id,order_id,points,reason) values(new.customer_id,new.id,v_points,'Points for completed order')
   on conflict do nothing;
  end if;
 end if;
 return new;
end;
$function$;
revoke all on function public.award_loyalty_points_on_completion() from public,anon,authenticated;
drop trigger if exists award_loyalty_points_after_order_completion on public.orders;
create trigger award_loyalty_points_after_order_completion after update of status on public.orders for each row execute function public.award_loyalty_points_on_completion();
drop function if exists public.place_order(jsonb,text,text,text,text,text,text,timestamptz);
create function public.place_order(
 p_items jsonb,p_contact_name text,p_contact_phone text,p_fulfillment_type text default 'delivery',
 p_address text default null,p_notes text default null,p_payment_method text default 'cod',
 p_scheduled_for timestamptz default null,p_promo_code text default null
) returns uuid language plpgsql security definer set search_path to ''
as $function$
declare
 v_user uuid:=auth.uid(); v_order_id uuid; v_subtotal integer:=0; v_fee integer:=0; v_discount integer:=0; v_total integer:=0;
 v_code text:=upper(trim(coalesce(p_promo_code,''))); v_offer public.offers%rowtype; v_item jsonb; v_menu public.menu_items%rowtype; v_qty integer;
begin
 if v_user is null then raise exception 'Please sign in to place an order'; end if;
 if coalesce(trim(p_contact_name),'')='' or coalesce(trim(p_contact_phone),'')='' then raise exception 'Name and phone number are required'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Your bag is empty'; end if;
 if p_fulfillment_type not in ('delivery','pickup') then raise exception 'Invalid fulfilment type'; end if;
 if p_fulfillment_type='delivery' and coalesce(trim(p_address),'')='' then raise exception 'Delivery address is required'; end if;
 if p_payment_method not in ('cod','prepaid','upi','card','netbanking') then raise exception 'Invalid payment method'; end if;
 if p_scheduled_for is not null and p_scheduled_for<now() then raise exception 'Choose a future scheduled time'; end if;
 if not exists(select 1 from public.store_settings where id=1 and is_accepting_orders) then raise exception 'The store is not accepting orders right now'; end if;
 for v_item in select value from jsonb_array_elements(p_items) loop
  v_qty:=coalesce((v_item->>'quantity')::integer,0);
  if v_qty<1 or v_qty>50 then raise exception 'Quantity must be between 1 and 50'; end if;
  select * into v_menu from public.menu_items where id=(v_item->>'menu_item_id')::uuid and is_available=true;
  if not found then raise exception 'A selected item is no longer available'; end if;
  v_subtotal:=v_subtotal+v_menu.price*v_qty;
 end loop;
 select delivery_fee into v_fee from public.store_settings where id=1;
 if p_fulfillment_type='pickup' then v_fee:=0; end if;
 if v_code<>'' then
  select * into v_offer from public.offers where upper(code)=v_code and is_active=true and (valid_until is null or valid_until>now()) for update;
  if not found then raise exception 'That coupon is invalid or expired'; end if;
  if v_subtotal<v_offer.min_order then raise exception 'This coupon does not meet the minimum order amount'; end if;
  if exists(select 1 from public.promo_redemptions where user_id=v_user and code=v_code) then raise exception 'You have already used this coupon'; end if;
  if v_offer.discount_type='percent' then
   if v_offer.discount_value>100 then raise exception 'Coupon configuration is invalid'; end if;
   v_discount:=floor(v_subtotal::numeric*v_offer.discount_value/100)::integer;
   if v_offer.max_discount is not null then v_discount:=least(v_discount,v_offer.max_discount); end if;
  else v_discount:=v_offer.discount_value;
  end if;
  v_discount:=least(v_subtotal,greatest(0,v_discount));
 end if;
 v_total:=greatest(0,v_subtotal+v_fee-v_discount);
 insert into public.orders(customer_id,status,fulfillment_type,contact_name,contact_phone,address,notes,subtotal,delivery_fee,discount,total,payment_method,payment_status,scheduled_for,coupon_code)
 values(v_user,'pending',p_fulfillment_type,trim(p_contact_name),trim(p_contact_phone),nullif(trim(p_address),''),nullif(trim(p_notes),''),v_subtotal,v_fee,v_discount,v_total,p_payment_method,'pending',p_scheduled_for,nullif(v_code,''))
 returning id into v_order_id;
 for v_item in select value from jsonb_array_elements(p_items) loop
  v_qty:=(v_item->>'quantity')::integer;
  select * into v_menu from public.menu_items where id=(v_item->>'menu_item_id')::uuid and is_available=true;
  insert into public.order_items(order_id,menu_item_id,item_name,variant,item_type,unit_price,quantity)
  values(v_order_id,v_menu.id,v_menu.name,v_menu.variant,v_menu.item_type,v_menu.price,v_qty);
 end loop;
 if v_code<>'' then insert into public.promo_redemptions(user_id,order_id,code,discount_amount) values(v_user,v_order_id,v_code,v_discount); end if;
 insert into public.order_events(order_id,status,note,created_by) values(v_order_id,'pending','Order placed',v_user);
 return v_order_id;
end;
$function$;
revoke all on function public.place_order(jsonb,text,text,text,text,text,text,timestamptz,text) from public,anon;
grant execute on function public.place_order(jsonb,text,text,text,text,text,text,timestamptz,text) to authenticated;
