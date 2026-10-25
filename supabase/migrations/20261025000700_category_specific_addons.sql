alter table public.add_on_options add column if not exists category_id uuid references public.menu_categories(id) on delete set null;
update public.add_on_options set category_id=(select id from public.menu_categories where lower(name) like '%pizza%' order by sort_order limit 1)
where name in ('Extra cheese','Extra mozzarella','Jalapeños','Olives','Mushrooms','Paneer')
and exists(select 1 from public.menu_categories where lower(name) like '%pizza%');
update public.add_on_options set category_id=(select id from public.menu_categories where lower(name) like '%burger%' order by sort_order limit 1)
where name='Extra patty' and exists(select 1 from public.menu_categories where lower(name) like '%burger%');
create index if not exists add_on_options_category_idx on public.add_on_options(category_id);