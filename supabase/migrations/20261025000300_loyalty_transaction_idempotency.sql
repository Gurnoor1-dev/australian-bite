drop index if exists public.loyalty_transactions_order_award_unique;
create unique index if not exists loyalty_transactions_user_order_award_unique
 on public.loyalty_transactions(user_id,order_id) where order_id is not null and points>0;