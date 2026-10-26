alter table public.orders add column if not exists payment_provider text;
alter table public.orders add column if not exists razorpay_order_id text;
alter table public.orders add column if not exists razorpay_payment_id text;
alter table public.orders add column if not exists razorpay_signature text;
create unique index if not exists orders_razorpay_order_id_unique on public.orders(razorpay_order_id) where razorpay_order_id is not null;
create unique index if not exists orders_razorpay_payment_id_unique on public.orders(razorpay_payment_id) where razorpay_payment_id is not null;
