-- StockWise database schema for Supabase.
-- Run this once in Supabase: SQL Editor → New query → paste → Run.

create table if not exists app_users (
  id text primary key,
  name text not null,
  role text not null default 'Staff',
  initials text
);

create table if not exists suppliers (
  id text primary key,
  name text not null,
  contact text,
  phone text,
  email text
);

create table if not exists products (
  id text primary key,
  code text unique,
  name text not null,
  unit text default 'pcs',
  category text default 'General',
  alert_level integer default 0,
  lead_time_days integer default 3,
  supplier_id text,
  created_at timestamptz default now(),
  created_by text
);

-- Each stock-in is a batch; stock-out takes from the oldest batch first (FIFO).
create table if not exists batches (
  id text primary key,
  batch_no text,
  product_id text not null,
  qty_in integer not null,
  qty_remaining integer not null,
  received_at timestamptz not null,
  staff text,
  source text
);

-- Activity log: every stock in, stock out, new product and reorder.
create table if not exists movements (
  id text primary key,
  type text not null,            -- in | out | new | reorder
  product_id text,
  qty integer default 0,
  at timestamptz not null,
  staff text,
  source text,                   -- scan | manual | delivery-note | whatsapp | email
  note text,
  batch_id text,
  batch_no text,
  allocations jsonb              -- which batches a stock-out was taken from
);

create table if not exists settings (
  id integer primary key default 1,
  name text,
  currency text default 'RM',
  reset_at timestamptz
);

create index if not exists batches_product_idx on batches (product_id, received_at);
create index if not exists movements_at_idx on movements (at desc);
create index if not exists movements_product_idx on movements (product_id);

-- Hackathon setting: anyone with the anon key can read and write.
-- Before real customers use it, replace these with Supabase Auth-based policies.
do $$
declare t text;
begin
  foreach t in array array['app_users','suppliers','products','batches','movements','settings'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "demo full access" on %I', t);
    execute format('create policy "demo full access" on %I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Live sync between devices
do $$
declare t text;
begin
  foreach t in array array['app_users','suppliers','products','batches','movements','settings'] loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
