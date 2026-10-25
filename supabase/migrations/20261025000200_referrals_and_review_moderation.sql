drop policy if exists "Staff moderate reviews" on public.order_reviews;
create policy "Staff moderate reviews" on public.order_reviews for select to authenticated using(private.has_any_role(array['admin']::public.app_role[]));
drop policy if exists "Admins update review visibility" on public.order_reviews;
create policy "Admins update review visibility" on public.order_reviews for update to authenticated
 using(private.has_any_role(array['admin']::public.app_role[]))
 with check(private.has_any_role(array['admin']::public.app_role[]));

create table if not exists public.referral_codes(
 user_id uuid primary key references auth.users(id) on delete cascade,
 code text not null unique,
 referred_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 check(referred_by is null or referred_by<>user_id)
);
alter table public.referral_codes enable row level security;
drop policy if exists "Customers read own referral code" on public.referral_codes;
create policy "Customers read own referral code" on public.referral_codes for select to authenticated using(user_id=(select auth.uid()));

create table if not exists public.referral_rewards(
 id uuid primary key default gen_random_uuid(),
 referrer_id uuid not null references auth.users(id) on delete cascade,
 referred_user_id uuid not null unique references auth.users(id) on delete cascade,
 order_id uuid not null unique references public.orders(id) on delete cascade,
 points integer not null default 100 check(points>0),
 created_at timestamptz not null default now()
);
alter table public.referral_rewards enable row level security;
drop policy if exists "Customers read referral rewards" on public.referral_rewards;
create policy "Customers read referral rewards" on public.referral_rewards for select to authenticated
 using(referrer_id=(select auth.uid()) or referred_user_id=(select auth.uid()));

create or replace function public.create_referral_code_for_new_user()
returns trigger language plpgsql security definer set search_path to ''
as $function$
declare v_code text; v_referrer uuid; v_input text;
begin
 v_code:='BITE'||upper(substr(replace(new.id::text,'-',''),1,6));
 insert into public.referral_codes(user_id,code) values(new.id,v_code) on conflict(user_id) do nothing;
 v_input:=upper(trim(coalesce(new.raw_user_meta_data->>'referral_code','')));
 if v_input<>'' then
  select user_id into v_referrer from public.referral_codes where upper(code)=v_input and user_id<>new.id;
  if v_referrer is not null then update public.referral_codes set referred_by=v_referrer where user_id=new.id and referred_by is null; end if;
 end if;
 return new;
end;
$function$;
revoke all on function public.create_referral_code_for_new_user() from public,anon,authenticated;
drop trigger if exists create_referral_code_after_signup on auth.users;
create trigger create_referral_code_after_signup after insert on auth.users for each row execute function public.create_referral_code_for_new_user();
insert into public.referral_codes(user_id,code)
select u.id,'BITE'||upper(substr(replace(u.id::text,'-',''),1,6)) from auth.users u
on conflict(user_id) do nothing;

create or replace function public.award_referral_bonus_on_completion()
returns trigger language plpgsql security definer set search_path to ''
as $function$
declare v_referrer uuid;
begin
 if new.status='completed' and old.status is distinct from 'completed' then
  select referred_by into v_referrer from public.referral_codes where user_id=new.customer_id;
  if v_referrer is not null and not exists(select 1 from public.referral_rewards where referred_user_id=new.customer_id) then
   insert into public.referral_rewards(referrer_id,referred_user_id,order_id,points)
   values(v_referrer,new.customer_id,new.id,100) on conflict do nothing;
   if found then
    insert into public.loyalty_accounts(user_id,points_balance,lifetime_points,updated_at) values(v_referrer,100,100,now())
    on conflict(user_id) do update set points_balance=public.loyalty_accounts.points_balance+100,
      lifetime_points=public.loyalty_accounts.lifetime_points+100,updated_at=now();
    insert into public.loyalty_transactions(user_id,order_id,points,reason)
    values(v_referrer,new.id,100,'Referral bonus') on conflict do nothing;
   end if;
  end if;
 end if;
 return new;
end;
$function$;
revoke all on function public.award_referral_bonus_on_completion() from public,anon,authenticated;
drop trigger if exists award_referral_bonus_after_order_completion on public.orders;
create trigger award_referral_bonus_after_order_completion after update of status on public.orders for each row execute function public.award_referral_bonus_on_completion();