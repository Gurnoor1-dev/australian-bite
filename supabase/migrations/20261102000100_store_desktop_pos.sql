-- Australian Bite desktop POS: counter orders and idempotent print-job tracking.
alter table public.orders
  add column if not exists order_source text not null default 'website',
  add column if not exists created_by uuid references auth.users(id) on delete set null;

do $$
begin
  alter table public.orders
    add constraint orders_order_source_check
    check (order_source in ('website', 'counter'));
exception
  when duplicate_object then null;
end $$;

create or replace function public.place_counter_order(
  p_items jsonb,
  p_contact_name text,
  p_contact_phone text,
  p_fulfillment_type text default 'pickup',
  p_address text default null,
  p_notes text default null,
  p_payment_method text default 'cod',
  p_scheduled_for timestamptz default null,
  p_promo_code text default null,
  p_request_key uuid default null,
  p_postal_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_order_id uuid;
  v_existing uuid;
begin
  if v_user is null or not private.has_any_role(array['store','admin']::public.app_role[]) then
    raise exception 'Store access required';
  end if;

  if p_request_key is null then
    raise exception 'A request key is required';
  end if;

  select id into v_existing
  from public.orders
  where customer_id = v_user and idempotency_key = p_request_key;

  if v_existing is not null then
    if not exists (
      select 1 from public.orders
      where id = v_existing and order_source = 'counter'
    ) then
      raise exception 'This request key was already used for another order';
    end if;
    return v_existing;
  end if;

  v_order_id := public.place_order(
    p_items,
    p_contact_name,
    p_contact_phone,
    p_fulfillment_type,
    p_address,
    p_notes,
    p_payment_method,
    p_scheduled_for,
    p_promo_code,
    p_request_key,
    p_postal_code
  );

  update public.orders
  set order_source = 'counter',
      created_by = v_user
  where id = v_order_id and customer_id = v_user;

  return v_order_id;
end;
$$;

revoke all on function public.place_counter_order(
  jsonb, text, text, text, text, text, text, timestamptz, text, uuid, text
) from public, anon;
grant execute on function public.place_counter_order(
  jsonb, text, text, text, text, text, text, timestamptz, text, uuid, text
) to authenticated;

create table if not exists public.store_print_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete restrict,
  terminal_id text not null default 'store-terminal',
  job_key uuid not null unique,
  status text not null default 'queued'
    check (status in ('queued', 'printed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  printed_at timestamptz
);

alter table public.store_print_jobs enable row level security;

drop policy if exists "Store staff manage print jobs" on public.store_print_jobs;
create policy "Store staff manage print jobs"
on public.store_print_jobs
for all
to authenticated
using (private.has_any_role(array['store','admin']::public.app_role[]))
with check (private.has_any_role(array['store','admin']::public.app_role[]));

grant select, insert, update on public.store_print_jobs to authenticated;
