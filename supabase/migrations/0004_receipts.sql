-- Migração: tabela `receipts` para controlar emissão de recibos de rendas

create extension if not exists "pgcrypto";

create table if not exists receipts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  property_id uuid references properties(id),
  bed_id uuid references beds(id),
  year int not null,
  month int not null,
  period_start date,
  period_end date,
  days_billed int,
  rent numeric not null,
  prorated boolean default false,
  prorated_amount numeric,
  amount_paid numeric default 0,
  issued_at timestamptz default now(),
  receipt_number text not null unique,
  payment_method text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_receipts_year_month on receipts(year, month);
