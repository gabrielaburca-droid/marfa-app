-- =====================================================================
-- Marfa: simple financial management for a trading business.
-- Core schema: businesses, users, settings, income, expenses,
-- attachments, audit log. No inventory/stock tables by design.
-- Money: NUMERIC(14,2). Exchange rates: NUMERIC(18,6) = RON per 1 unit.
-- =====================================================================

create extension if not exists citext with schema extensions;

-- Helper functions live in a schema that PostgREST does not expose.
create schema if not exists private;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type public.member_role as enum ('admin', 'operator');
create type public.channel_kind as enum ('market', 'online', 'other');
create type public.income_entry_kind as enum ('aggregate', 'sale');
create type public.income_status as enum ('received', 'pending', 'cancelled');
create type public.expense_status as enum ('paid', 'unpaid');
create type public.payment_method as enum ('cash', 'card', 'transfer', 'mixed', 'other');
-- How an expense category is grouped in the dashboard and reports.
create type public.expense_group as enum (
  'merchandise',       -- Achiziții marfă
  'transport_import',  -- Transport, combustibil și import
  'market',            -- Târguri
  'operating',         -- Alte cheltuieli operaționale
  'fines'              -- Amenzi (always separately identifiable)
);

-- ---------------------------------------------------------------------
-- Businesses, profiles, memberships
-- ---------------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  legal_name text,
  tax_id text,              -- CUI
  registration_number text, -- Nr. Reg. Com.
  address text,
  base_currency char(3) not null default 'RON' check (base_currency = 'RON'),
  enabled_currencies text[] not null default array['RON','EUR','USD','GBP','PLN','HUF','TRY','CNY'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email extensions.citext not null,
  full_name text not null default '' check (length(full_name) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'operator',
  -- Operators see reports/dashboard only when this is granted.
  can_view_reports boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id)
);
create index on public.business_memberships (user_id) where is_active;

-- ---------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER so policies don't recurse)
-- ---------------------------------------------------------------------
create function private.is_member(p_business uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.business_memberships m
    where m.business_id = p_business
      and m.user_id = (select auth.uid())
      and m.is_active
  );
$$;

create function private.is_admin(p_business uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.business_memberships m
    where m.business_id = p_business
      and m.user_id = (select auth.uid())
      and m.is_active
      and m.role = 'admin'
  );
$$;

create function private.can_view_reports(p_business uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.business_memberships m
    where m.business_id = p_business
      and m.user_id = (select auth.uid())
      and m.is_active
      and (m.role = 'admin' or m.can_view_reports)
  );
$$;

create function private.shares_business(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.business_memberships me
    join public.business_memberships other on other.business_id = me.business_id
    where me.user_id = (select auth.uid()) and me.is_active
      and other.user_id = p_user
  );
$$;

revoke all on function private.is_member(uuid), private.is_admin(uuid),
  private.can_view_reports(uuid), private.shares_business(uuid) from public;
grant execute on function private.is_member(uuid), private.is_admin(uuid),
  private.can_view_reports(uuid), private.shares_business(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Settings: categories, channels, locations, exchange rates
-- ---------------------------------------------------------------------
create table public.income_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);
create unique index income_categories_name_uq on public.income_categories (business_id, lower(name));

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  report_group public.expense_group not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);
create unique index expense_categories_name_uq on public.expense_categories (business_id, lower(name));

create table public.market_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  city text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);
create unique index market_locations_name_uq on public.market_locations (business_id, lower(name));

create table public.sales_channels (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  kind public.channel_kind not null,
  -- Physical market channels point at their location.
  market_location_id uuid,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, market_location_id) references public.market_locations (business_id, id)
);
create unique index sales_channels_name_uq on public.sales_channels (business_id, lower(name));

create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  currency char(3) not null check (currency ~ '^[A-Z]{3}$' and currency <> 'RON'),
  rate_date date not null,
  rate_to_ron numeric(18,6) not null check (rate_to_ron > 0),
  source text not null default 'manual' check (source in ('manual', 'bnr')),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, currency, rate_date)
);

-- ---------------------------------------------------------------------
-- Income
-- ---------------------------------------------------------------------
create table public.income_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- 'aggregate' = one total for a market day or a channel+period;
  -- 'sale' = one individual (online) sale. Never both for the same channel+date.
  entry_kind public.income_entry_kind not null,
  entry_date date not null,
  period_start date not null,
  period_end date not null,
  income_category_id uuid,
  channel_id uuid not null,
  market_location_id uuid,

  currency char(3) not null default 'RON' check (currency ~ '^[A-Z]{3}$'),
  exchange_rate numeric(18,6) not null default 1 check (exchange_rate > 0),

  -- Aggregate total, or the selling price of an individual sale.
  gross_amount numeric(14,2) not null check (gross_amount >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  refund_amount numeric(14,2) not null default 0 check (refund_amount >= 0),
  -- Deductions already netted out of revenue. Do NOT also record these as expenses.
  commission_amount numeric(14,2) not null default 0 check (commission_amount >= 0),
  shipping_amount numeric(14,2) not null default 0 check (shipping_amount >= 0),

  net_amount numeric(14,2) generated always as
    (gross_amount - discount_amount - refund_amount - commission_amount - shipping_amount) stored,
  gross_amount_ron numeric(14,2) generated always as
    (round(gross_amount * exchange_rate, 2)) stored,
  net_amount_ron numeric(14,2) generated always as
    (round((gross_amount - discount_amount - refund_amount - commission_amount - shipping_amount) * exchange_rate, 2)) stored,

  -- Optional split of the money received from customers. Components of the
  -- same total, never additional income.
  payment_method public.payment_method not null default 'cash',
  cash_amount numeric(14,2) check (cash_amount >= 0),
  card_amount numeric(14,2) check (card_amount >= 0),
  other_amount numeric(14,2) check (other_amount >= 0),

  status public.income_status not null default 'received',
  received_on date,

  description text not null default '' check (length(description) <= 500),
  product_name text check (length(product_name) <= 200),
  product_category text check (length(product_category) <= 100),
  reference text check (length(reference) <= 100),
  notes text check (length(notes) <= 2000),
  -- Idempotency key generated by the form to stop double submissions.
  client_token uuid,

  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id),

  foreign key (business_id, income_category_id) references public.income_categories (business_id, id),
  foreign key (business_id, channel_id) references public.sales_channels (business_id, id),
  foreign key (business_id, market_location_id) references public.market_locations (business_id, id),
  constraint income_ron_rate check (currency <> 'RON' or exchange_rate = 1),
  constraint income_period check (period_start <= period_end),
  constraint income_sale_single_day check (entry_kind = 'aggregate' or (period_start = entry_date and period_end = entry_date)),
  constraint income_deductions check (discount_amount + refund_amount <= gross_amount),
  constraint income_breakdown check (
    (cash_amount is null and card_amount is null and other_amount is null)
    or coalesce(cash_amount, 0) + coalesce(card_amount, 0) + coalesce(other_amount, 0)
       = gross_amount - discount_amount - refund_amount
  ),
  constraint income_received_on check (status <> 'received' or received_on is not null),
  unique (business_id, id)
);
create unique index income_client_token_uq on public.income_entries (business_id, client_token) where client_token is not null;
create unique index income_reference_uq on public.income_entries (business_id, channel_id, lower(reference))
  where reference is not null and deleted_at is null;
create index income_business_date_idx on public.income_entries (business_id, entry_date desc) where deleted_at is null;
create index income_channel_period_idx on public.income_entries (business_id, channel_id, period_start, period_end) where deleted_at is null;
create index income_created_by_idx on public.income_entries (business_id, created_by);

-- ---------------------------------------------------------------------
-- Expenses
-- ---------------------------------------------------------------------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  expense_date date not null,
  category_id uuid not null,
  description text not null default '' check (length(description) <= 500),
  currency char(3) not null default 'RON' check (currency ~ '^[A-Z]{3}$'),
  exchange_rate numeric(18,6) not null default 1 check (exchange_rate > 0),
  amount numeric(14,2) not null check (amount > 0),
  amount_ron numeric(14,2) generated always as (round(amount * exchange_rate, 2)) stored,
  payment_method public.payment_method not null default 'cash',
  status public.expense_status not null default 'paid',
  paid_on date,
  supplier text check (length(supplier) <= 200),
  channel_id uuid,
  market_location_id uuid,
  trip_label text check (length(trip_label) <= 200),
  reference text check (length(reference) <= 100),
  notes text check (length(notes) <= 2000),
  client_token uuid,

  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id),

  foreign key (business_id, category_id) references public.expense_categories (business_id, id),
  foreign key (business_id, channel_id) references public.sales_channels (business_id, id),
  foreign key (business_id, market_location_id) references public.market_locations (business_id, id),
  constraint expense_ron_rate check (currency <> 'RON' or exchange_rate = 1),
  constraint expense_paid_on check (status <> 'paid' or paid_on is not null),
  unique (business_id, id)
);
create unique index expenses_client_token_uq on public.expenses (business_id, client_token) where client_token is not null;
create index expenses_business_date_idx on public.expenses (business_id, expense_date desc) where deleted_at is null;
create index expenses_category_idx on public.expenses (business_id, category_id) where deleted_at is null;
create index expenses_created_by_idx on public.expenses (business_id, created_by);

-- ---------------------------------------------------------------------
-- Attachments (files live in the private 'attachments' storage bucket
-- under <business_id>/<entity>/<uuid>-<filename>)
-- ---------------------------------------------------------------------
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  expense_id uuid,
  income_entry_id uuid,
  storage_path text not null unique check (storage_path like business_id::text || '/%'),
  file_name text not null check (length(file_name) between 1 and 255),
  mime_type text not null,
  size_bytes int not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (business_id, expense_id) references public.expenses (business_id, id),
  foreign key (business_id, income_entry_id) references public.income_entries (business_id, id),
  constraint attachment_one_parent check (num_nonnulls(expense_id, income_entry_id) = 1)
);
create index on public.attachments (expense_id) where expense_id is not null;
create index on public.attachments (income_entry_id) where income_entry_id is not null;

-- ---------------------------------------------------------------------
-- Audit log (written only by triggers)
-- ---------------------------------------------------------------------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  business_id uuid references public.businesses (id) on delete cascade,
  actor_id uuid,
  action text not null check (action in ('insert', 'update', 'delete', 'soft_delete', 'restore')),
  entity_type text not null,
  entity_id uuid,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_business_idx on public.audit_logs (business_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
