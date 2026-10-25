create table if not exists public.add_on_options(
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 2 and 60),
 description text,
 price integer not null default 0 check(price>=0),
 is_available boolean not null default true,
 sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
alter table public.add_on_options enable row level security;
drop policy if exists "Anyone can view available add-ons" on public.add_on_options;
create policy "Anyone can view available add-ons" on public.add_on_options for select to anon,authenticated using(is_available or private.has_any_role(array['store','admin']::public.app_role[]));
drop policy if exists "Store staff manage add-ons" on public.add_on_options;
create policy "Store staff manage add-ons" on public.add_on_options for all to authenticated using(private.has_any_role(array['store','admin']::public.app_role[])) with check(private.has_any_role(array['store','admin']::public.app_role[]));

create table if not exists public.order_item_addons(
 id uuid primary key default gen_random_uuid(),
 order_item_id uuid not null references public.order_items(id) on delete cascade,
 add_on_option_id uuid references public.add_on_options(id) on delete set null,
 name text not null,
 unit_price integer not null check(unit_price>=0),
 quantity integer not null default 1 check(quantity>0),
 created_at timestamptz not null default now()
);
alter table public.order_item_addons enable row level security;
drop policy if exists "Order participants can read add-ons" on public.order_item_addons;
create policy "Order participants can read add-ons" on public.order_item_addons for select to authenticated using(exists(
 select 1 from public.order_items oi join public.orders o on o.id=oi.order_id
 where oi.id=order_item_addons.order_item_id and (o.customer_id=(select auth.uid()) or private.has_any_role(array['store','admin','delivery']::public.app_role[]))
));
create index if not exists order_item_addons_item_idx on public.order_item_addons(order_item_id);
create index if not exists add_on_options_available_sort_idx on public.add_on_options(is_available,sort_order);

insert into public.add_on_options(name,description,price,sort_order)
select v.name,v.description,v.price,v.sort_order from (values
 ('Extra cheese','A melty cheese upgrade',25,10),
 ('Extra mozzarella','More stretchy mozzarella',35,20),
 ('Jalapeños','A spicy kick',20,30),
 ('Olives','A salty, savoury finish',20,40),
 ('Mushrooms','Extra earthy flavour',25,50),
 ('Paneer','More paneer on every bite',35,60),
 ('Extra patty','Make it a bigger bite',49,70),
 ('Garlic dip','Creamy garlic dip',20,80),
 ('Peri-peri fries','A spicy side upgrade',39,90),
 ('Cold drink','Chilled drink',35,100)
) as v(name,description,price,sort_order)
where not exists(select 1 from public.add_on_options a where a.name=v.name);

create or replace function public.place_order(
 p_items jsonb,p_contact_name text,p_contact_phone text,p_fulfillment_type text default 'delivery',
 p_address text default null,p_notes text default null,p_payment_method text default 'cod',
 p_scheduled_for timestamptz default null,p_promo_code text default null
) returns uuid
language plpgsql security definer set search_path to ''
as $function$
declare
 v_user uuid:=auth.uid(); v_order_id uuid; v_order_item_id uuid;
 v_subtotal integer:=0; v_fee integer:=0; v_discount integer:=0; v_total integer:=0;
 v_code text:=upper(trim(coalesce(p_promo_code,''))); v_offer public.offers%rowtype;
 v_item jsonb; v_menu public.menu_items%rowtype; v_addon public.add_on_options%rowtype;
 v_qty integer; v_addon_ids uuid[]; v_addon_sum integer;
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
  v_addon_ids:=array[]::uuid[];
  if jsonb_typeof(v_item->'addon_ids')='array' then
   select coalesce(array_agg(distinct x::uuid),array[]::uuid[]) into v_addon_ids from jsonb_array_elements_text(v_item->'addon_ids') as t(x);
  end if;
  if cardinality(v_addon_ids)>6 then raise exception 'Choose up to 6 add-ons per item'; end if;
  select coalesce(sum(price),0) into v_addon_sum from public.add_on_options where id=any(v_addon_ids) and is_available=true;
  if v_addon_sum<>(select coalesce(sum(a.price),0) from public.add_on_options a where a.id=any(v_addon_ids)) then raise exception 'An add-on is no longer available'; end if;
  if cardinality(v_addon_ids)<>(select count(*) from public.add_on_options where id=any(v_addon_ids)) then raise exception 'One of your add-ons could not be found'; end if;
  v_subtotal:=v_subtotal+(v_menu.price+v_addon_sum)*v_qty;
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
  else v_discount:=v_offer.discount_value; end if;
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
  values(v_order_id,v_menu.id,v_menu.name,v_menu.variant,v_menu.item_type,v_menu.price,v_qty)
  returning id into v_order_item_id;
  if jsonb_typeof(v_item->'addon_ids')='array' then
   for v_addon in select a.* from public.add_on_options a where a.id in (select x::uuid from jsonb_array_elements_text(v_item->'addon_ids') as t(x)) and a.is_available=true loop
    insert into public.order_item_addons(order_item_id,add_on_option_id,name,unit_price,quantity)
    values(v_order_item_id,v_addon.id,v_addon.name,v_addon.price,v_qty);
   end loop;
  end if;
 end loop;
 if v_code<>'' then insert into public.promo_redemptions(user_id,order_id,code,discount_amount) values(v_user,v_order_id,v_code,v_discount); end if;
 insert into public.order_events(order_id,status,note,created_by) values(v_order_id,'pending','Order placed',v_user);
 return v_order_id;
end;
$function$;
revoke all on function public.place_order(jsonb,text,text,text,text,text,text,timestamptz,text) from public,anon;
grant execute on function public.place_order(jsonb,text,text,text,text,text,text,timestamptz,text) to authenticated;
