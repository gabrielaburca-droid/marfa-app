-- =====================================================================
-- Triggers (audit fields, integrity guards, audit log, defaults) and
-- Row Level Security policies.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Profiles are created automatically for every auth user.
-- ---------------------------------------------------------------------
create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------
-- created_by / updated_by / timestamps cannot be spoofed by clients.
-- ---------------------------------------------------------------------
create function private.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function private.set_audit_fields()
returns trigger language plpgsql as $$
declare
  uid uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(uid, new.created_by);
    new.updated_by := new.created_by;
    new.created_at := now();
    new.updated_at := now();
  else
    if new.business_id is distinct from old.business_id then
      raise exception 'Înregistrarea nu poate fi mutată în altă firmă.' using errcode = '42501';
    end if;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.updated_by := coalesce(uid, new.updated_by);
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger touch before update on public.businesses
  for each row execute function private.touch_updated_at();
create trigger touch before update on public.profiles
  for each row execute function private.touch_updated_at();
create trigger touch before update on public.business_memberships
  for each row execute function private.touch_updated_at();

do $$
declare t text;
begin
  foreach t in array array['income_categories','expense_categories','market_locations',
                           'sales_channels','exchange_rates','income_entries','expenses']
  loop
    execute format('create trigger set_audit_fields before insert or update on public.%I
                    for each row execute function private.set_audit_fields()', t);
  end loop;
end $$;

create function private.set_attachment_fields()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.created_at := now();
  elsif new.business_id is distinct from old.business_id
     or new.storage_path is distinct from old.storage_path then
    raise exception 'Fișierul atașat nu poate fi mutat.' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger set_attachment_fields before insert or update on public.attachments
  for each row execute function private.set_attachment_fields();

-- ---------------------------------------------------------------------
-- Soft delete: only admins may delete or restore income and expenses,
-- and deleted records are read-only.
-- ---------------------------------------------------------------------
create function private.guard_soft_delete()
returns trigger language plpgsql as $$
declare
  uid uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    new.deleted_at := null;
    new.deleted_by := null;
    return new;
  end if;

  if old.deleted_at is not null and new.deleted_at is not null then
    raise exception 'Înregistrarea a fost ștearsă și nu mai poate fi modificată.' using errcode = '42501';
  end if;

  if new.deleted_at is distinct from old.deleted_at then
    if uid is not null and not private.is_admin(old.business_id) then
      raise exception 'Doar administratorii pot șterge sau restaura înregistrări.' using errcode = '42501';
    end if;
    new.deleted_by := case when new.deleted_at is null then null else uid end;
  else
    new.deleted_by := old.deleted_by;
  end if;
  return new;
end;
$$;

create trigger guard_soft_delete before insert or update on public.income_entries
  for each row execute function private.guard_soft_delete();
create trigger guard_soft_delete before insert or update on public.expenses
  for each row execute function private.guard_soft_delete();

-- ---------------------------------------------------------------------
-- Income defaults and the "never count twice" rule:
-- for one channel, an aggregate entry covering a period and individual
-- sales on a date inside that period cannot coexist.
-- ---------------------------------------------------------------------
create function private.income_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  conflict_id uuid;
begin
  if new.entry_kind = 'sale' then
    new.period_start := new.entry_date;
    new.period_end := new.entry_date;
  else
    new.period_start := coalesce(new.period_start, new.entry_date);
    new.period_end := coalesce(new.period_end, new.entry_date);
  end if;

  if new.currency = 'RON' then
    new.exchange_rate := 1;
  end if;

  if new.status = 'received' and new.received_on is null then
    new.received_on := new.entry_date;
  elsif new.status <> 'received' then
    new.received_on := null;
  end if;

  if new.market_location_id is null then
    select c.market_location_id into new.market_location_id
    from public.sales_channels c
    where c.business_id = new.business_id and c.id = new.channel_id;
  end if;

  if new.deleted_at is null and new.status <> 'cancelled' then
    -- Serialize writers per channel so two concurrent inserts can't both pass.
    perform pg_advisory_xact_lock(hashtextextended(new.business_id::text || new.channel_id::text, 0));

    if new.entry_kind = 'sale' then
      select e.id into conflict_id
      from public.income_entries e
      where e.business_id = new.business_id
        and e.channel_id = new.channel_id
        and e.entry_kind = 'aggregate'
        and e.deleted_at is null and e.status <> 'cancelled'
        and e.id <> new.id
        and new.entry_date between e.period_start and e.period_end
      limit 1;
    else
      select e.id into conflict_id
      from public.income_entries e
      where e.business_id = new.business_id
        and e.channel_id = new.channel_id
        and e.entry_kind = 'sale'
        and e.deleted_at is null and e.status <> 'cancelled'
        and e.id <> new.id
        and e.entry_date between new.period_start and new.period_end
      limit 1;
    end if;

    if conflict_id is not null then
      raise exception 'INCOME_OVERLAP'
        using errcode = '23P01',
              detail = 'Pentru acest canal și perioadă există deja ' ||
                       case when new.entry_kind = 'sale' then 'o încasare totală (agregată).'
                            else 'vânzări individuale.' end ||
                       ' Aceeași încasare nu poate fi înregistrată de două ori.',
              hint = conflict_id::text;
    end if;
  end if;
  return new;
end;
$$;

create trigger income_before_write before insert or update on public.income_entries
  for each row execute function private.income_before_write();

create function private.expense_before_write()
returns trigger language plpgsql as $$
begin
  if new.currency = 'RON' then
    new.exchange_rate := 1;
  end if;
  if new.status = 'paid' and new.paid_on is null then
    new.paid_on := new.expense_date;
  elsif new.status <> 'paid' then
    new.paid_on := null;
  end if;
  return new;
end;
$$;

create trigger expense_before_write before insert or update on public.expenses
  for each row execute function private.expense_before_write();

-- ---------------------------------------------------------------------
-- Memberships: identity columns are fixed, and a business always keeps
-- at least one active admin.
-- ---------------------------------------------------------------------
create function private.guard_membership()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (new.business_id <> old.business_id or new.user_id <> old.user_id) then
    raise exception 'Membrul nu poate fi mutat.' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    return new;
  end if;

  if old.role = 'admin' and old.is_active
     and (tg_op = 'DELETE' or new.role <> 'admin' or not new.is_active)
     and not exists (
       select 1 from public.business_memberships m
       where m.business_id = old.business_id and m.id <> old.id
         and m.role = 'admin' and m.is_active
     ) then
    raise exception 'Firma trebuie să aibă cel puțin un administrator activ.' using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger guard_membership before insert or update or delete on public.business_memberships
  for each row execute function private.guard_membership();

-- ---------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------
create function private.write_audit_log()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  new_row jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  old_row jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  row_data jsonb := coalesce(new_row, old_row);
  ignored text[] := array['updated_at', 'updated_by', 'created_at'];
  diff jsonb := '{}'::jsonb;
  k text;
  act text := lower(tg_op);
begin
  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(new_row) loop
      if not (k = any (ignored)) and new_row -> k is distinct from old_row -> k then
        diff := diff || jsonb_build_object(k, jsonb_build_object('old', old_row -> k, 'new', new_row -> k));
      end if;
    end loop;
    if diff = '{}'::jsonb then
      return null;
    end if;
    if diff ? 'deleted_at' then
      act := case when new_row ->> 'deleted_at' is null then 'restore' else 'soft_delete' end;
    end if;
  else
    diff := row_data - ignored;
  end if;

  insert into public.audit_logs (business_id, actor_id, action, entity_type, entity_id, changes)
  values (
    case when tg_table_name = 'businesses' then (row_data ->> 'id')::uuid
         else (row_data ->> 'business_id')::uuid end,
    auth.uid(),
    act,
    tg_table_name,
    (row_data ->> 'id')::uuid,
    diff
  );
  return null;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['businesses','business_memberships','income_categories','expense_categories',
                           'market_locations','sales_channels','exchange_rates','income_entries',
                           'expenses','attachments']
  loop
    execute format('create trigger write_audit_log after insert or update or delete on public.%I
                    for each row execute function private.write_audit_log()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Default settings for every new business
-- ---------------------------------------------------------------------
create function private.seed_business_defaults()
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
    (b, 'Alte canale online', 'online', null, 6),
    (b, 'Alte încasări', 'other', null, 7);

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

create trigger seed_business_defaults after insert on public.businesses
  for each row execute function private.seed_business_defaults();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.business_memberships enable row level security;
alter table public.income_categories enable row level security;
alter table public.expense_categories enable row level security;
alter table public.market_locations enable row level security;
alter table public.sales_channels enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.income_entries enable row level security;
alter table public.expenses enable row level security;
alter table public.attachments enable row level security;
alter table public.audit_logs enable row level security;

-- Anonymous visitors get nothing, even before RLS is consulted.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- No hard deletes of business data from the API; only service-role tooling.
revoke delete on public.businesses, public.profiles, public.business_memberships,
  public.income_categories, public.expense_categories, public.market_locations,
  public.sales_channels, public.income_entries, public.expenses, public.attachments,
  public.audit_logs from authenticated;
revoke insert, update on public.audit_logs from authenticated;
revoke insert on public.businesses, public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- businesses
create policy "members read their business" on public.businesses
  for select to authenticated using (private.is_member(id));
create policy "admins update their business" on public.businesses
  for update to authenticated using (private.is_admin(id)) with check (private.is_admin(id));

-- profiles
create policy "read own and co-member profiles" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or private.shares_business(id));
create policy "update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- memberships
create policy "members read memberships" on public.business_memberships
  for select to authenticated using (user_id = (select auth.uid()) or private.is_member(business_id));
create policy "admins add memberships" on public.business_memberships
  for insert to authenticated with check (private.is_admin(business_id));
create policy "admins change memberships" on public.business_memberships
  for update to authenticated using (private.is_admin(business_id)) with check (private.is_admin(business_id));

-- settings tables: everyone in the business reads, admins write
do $$
declare t text;
begin
  foreach t in array array['income_categories','expense_categories','market_locations','sales_channels']
  loop
    execute format('create policy "members read" on public.%I for select to authenticated
                    using (private.is_member(business_id))', t);
    execute format('create policy "admins insert" on public.%I for insert to authenticated
                    with check (private.is_admin(business_id))', t);
    execute format('create policy "admins update" on public.%I for update to authenticated
                    using (private.is_admin(business_id)) with check (private.is_admin(business_id))', t);
  end loop;
end $$;

-- exchange rates: members may save a rate while entering data; admins correct/delete
create policy "members read" on public.exchange_rates
  for select to authenticated using (private.is_member(business_id));
create policy "members insert" on public.exchange_rates
  for insert to authenticated with check (private.is_member(business_id));
create policy "admins update" on public.exchange_rates
  for update to authenticated using (private.is_admin(business_id)) with check (private.is_admin(business_id));
create policy "admins delete" on public.exchange_rates
  for delete to authenticated using (private.is_admin(business_id));

-- income and expenses:
--   * operators see their own records; admins and operators with report
--     access see all records of the business
--   * operators edit only their own, non-deleted records
--   * soft-deleted records are visible to admins only
do $$
declare t text;
begin
  foreach t in array array['income_entries','expenses']
  loop
    execute format($p$create policy "members read" on public.%I for select to authenticated
      using (
        private.is_member(business_id)
        and (created_by = (select auth.uid()) or private.can_view_reports(business_id))
        and (deleted_at is null or private.is_admin(business_id))
      )$p$, t);
    execute format($p$create policy "members insert" on public.%I for insert to authenticated
      with check (private.is_member(business_id))$p$, t);
    execute format($p$create policy "edit own or admin" on public.%I for update to authenticated
      using (
        private.is_admin(business_id)
        or (private.is_member(business_id) and created_by = (select auth.uid()) and deleted_at is null)
      )
      with check (private.is_member(business_id))$p$, t);
  end loop;
end $$;

-- attachments
create policy "members read" on public.attachments
  for select to authenticated using (
    private.is_member(business_id)
    and (created_by = (select auth.uid()) or private.can_view_reports(business_id))
    and (deleted_at is null or private.is_admin(business_id))
  );
create policy "members insert" on public.attachments
  for insert to authenticated with check (private.is_member(business_id));
create policy "admins update" on public.attachments
  for update to authenticated using (private.is_admin(business_id)) with check (private.is_admin(business_id));

-- audit log: admins read, nobody writes through the API
create policy "admins read" on public.audit_logs
  for select to authenticated using (private.is_admin(business_id));

-- ---------------------------------------------------------------------
-- Storage: private bucket, files under <business_id>/...
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create function private.path_business(p_name text)
returns uuid language plpgsql immutable as $$
begin
  return (storage.foldername(p_name))[1]::uuid;
exception when others then
  return null;
end;
$$;
grant execute on function private.path_business(text) to authenticated;

create policy "members read attachments" on storage.objects
  for select to authenticated
  using (bucket_id = 'attachments' and private.is_member(private.path_business(name)));
create policy "members upload attachments" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments' and private.is_member(private.path_business(name)));
create policy "admins delete attachments" on storage.objects
  for delete to authenticated
  using (bucket_id = 'attachments' and private.is_admin(private.path_business(name)));
