insert into public.add_on_options(name,description,price,is_available,sort_order,category_id)
select a.name,a.description,a.price,a.is_available,a.sort_order,c.id
from public.add_on_options a
cross join public.menu_categories c
where a.category_id=(select id from public.menu_categories where lower(name) like '%pizza%' order by sort_order limit 1)
and lower(c.name) like '%pizza%'
and c.id<>a.category_id
and not exists(select 1 from public.add_on_options existing where existing.name=a.name and existing.category_id=c.id);