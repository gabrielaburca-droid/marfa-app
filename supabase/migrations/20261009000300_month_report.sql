-- Monthly report and two more default sales channels.

-- ---------------------------------------------------------------------
-- Channels: Instagram and direct customers (people who buy from the
-- notebook list, by phone, at home...). Added to every existing business
-- that does not have them yet, and to the defaults of new businesses.
-- ---------------------------------------------------------------------
insert into public.sales_channels (business_id, name, kind, sort_order)
select b.id, c.name, c.kind::public.channel_kind, c.sort_order
from public.businesses b
cross join (values ('Instagram', 'online', 6), ('Clienți direcți', 'other', 8)) as c (name, kind, sort_order)
where not exists (
  select 1 from public.sales_channels s where s.business_id = b.id and lower(s.name) = lower(c.name)
);

create or replace function private.seed_business_defaults()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  b uuid := new.id;
  loc_bacau uuid;
  loc_suceava uuid;
begin
  insert into public.market_locations (business_id, name, city, sort_order)
    values (b, 'Târg Bacău', 'Bacău', 1) returning id into loc_bacau;
  insert into public.market_locations (business_id, name, city, sort_order)
    values (b, 'Târg Suceava', 'Suceava', 2) returning id into loc_suceava;

  insert into public.sales_channels (business_id, name, kind, market_location_id, sort_order) values
    (b, 'Târg Bacău', 'market', loc_bacau, 1),
    (b, 'Târg Suceava', 'market', loc_suceava, 2),
    (b, 'OLX', 'online', null, 3),
    (b, 'Vinted', 'online', null, 4),
    (b, 'Facebook Marketplace', 'online', null, 5),
    (b, 'Instagram', 'online', null, 6),
    (b, 'Alte canale online', 'online', null, 7),
    (b, 'Clienți direcți', 'other', null, 8),
    (b, 'Alte încasări', 'other', null, 9);

  insert into public.income_categories (business_id, name, sort_order) values
    (b, 'Vânzări marfă', 1),
    (b, 'Alte venituri', 2);

  insert into public.expense_categories (business_id, name, report_group, sort_order) values
    (b, 'Achiziții marfă', 'merchandise', 1),
    (b, 'Combustibil drumuri import', 'transport_import', 2),
    (b, 'Transport internațional', 'transport_import', 3),
    (b, 'Taxe de drum', 'transport_import', 4),
    (b, 'Viniete', 'transport_import', 5),
    (b, 'Taxe vamale și de import', 'transport_import', 6),
    (b, 'Alte cheltuieli de import', 'transport_import', 7),
    (b, 'Taxe Târg Bacău', 'market', 8),
    (b, 'Taxe Târg Suceava', 'market', 9),
    (b, 'Combustibil drumuri târg', 'transport_import', 10),
    (b, 'Parcare', 'market', 11),
    (b, 'Cazare', 'market', 12),
    (b, 'Ambalaje', 'operating', 13),
    (b, 'Comisioane online', 'operating', 14),
    (b, 'Expediere', 'operating', 15),
    (b, 'Rambursări și retururi', 'operating', 16),
    (b, 'Amenzi', 'fines', 17),
    (b, 'Reparații', 'operating', 18),
    (b, 'Alte cheltuieli operaționale', 'operating', 19);
  return null;
end;
$$;

-- ---------------------------------------------------------------------
-- month_report: totals for one business and date range, summed in
-- NUMERIC so no rounding happens outside Postgres. SECURITY INVOKER: RLS
-- decides which rows count (an operator without report access sees only
-- what they entered). Deleted and cancelled records never count.
-- Aggregate income is counted in the month its period ends.
-- ---------------------------------------------------------------------
create function public.month_report(p_business uuid, p_from date, p_to date)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with inc as (
    select e.channel_id, e.net_amount_ron
    from public.income_entries e
    where e.business_id = p_business
      and e.deleted_at is null and e.status <> 'cancelled'
      and e.period_end between p_from and p_to
  ),
  exp as (
    select x.category_id, x.amount_ron
    from public.expenses x
    where x.business_id = p_business
      and x.deleted_at is null
      and x.expense_date between p_from and p_to
  )
  select jsonb_build_object(
    'income', (select coalesce(sum(net_amount_ron), 0)::text from inc),
    'income_count', (select count(*) from inc),
    'expenses', (select coalesce(sum(amount_ron), 0)::text from exp),
    'expense_count', (select count(*) from exp),
    'fines', (
      select coalesce(sum(exp.amount_ron), 0)::text
      from exp join public.expense_categories c on c.business_id = p_business and c.id = exp.category_id
      where c.report_group = 'fines'
    ),
    'channels', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'kind', s.kind,
        'total', t.total::text, 'count', t.n) order by t.total desc, s.sort_order)
      from (select channel_id, sum(net_amount_ron) as total, count(*) as n from inc group by channel_id) t
      join public.sales_channels s on s.business_id = p_business and s.id = t.channel_id
    ), '[]'::jsonb),
    'groups', coalesce((
      select jsonb_agg(jsonb_build_object('group', t.report_group, 'total', t.total::text, 'count', t.n)
        order by t.total desc)
      from (
        select c.report_group, sum(exp.amount_ron) as total, count(*) as n
        from exp join public.expense_categories c on c.business_id = p_business and c.id = exp.category_id
        group by c.report_group
      ) t
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.month_report(uuid, date, date) from public, anon;
grant execute on function public.month_report(uuid, date, date) to authenticated;

-- Latest month (first day) with a record the caller can see, for the
-- report's default month.
create function public.latest_activity_month(p_business uuid, p_until date)
returns date language sql stable security invoker set search_path = '' as $$
  select date_trunc('month', max(d))::date from (
    select max(e.period_end) as d from public.income_entries e
      where e.business_id = p_business and e.deleted_at is null and e.period_end <= p_until
    union all
    select max(x.expense_date) from public.expenses x
      where x.business_id = p_business and x.deleted_at is null and x.expense_date <= p_until
  ) t;
$$;

revoke all on function public.latest_activity_month(uuid, date) from public, anon;
grant execute on function public.latest_activity_month(uuid, date) to authenticated;
