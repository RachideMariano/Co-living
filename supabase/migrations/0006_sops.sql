-- 0006_sops.sql
-- Create sops table and link expenses to sops
create table if not exists sops (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null,
  tenant_id uuid,
  created_by text,
  created_at timestamptz default now(),
  title text not null,
  description text,
  status text not null default 'open',
  documents jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb
);

alter table if exists expenses add column if not exists sop_id uuid;

alter table if exists sops
  add constraint sops_property_fkey foreign key (property_id) references properties(id) on delete cascade;

alter table if exists sops
  add constraint sops_tenant_fkey foreign key (tenant_id) references tenants(id) on delete set null;

-- optional: index by property and created_at
create index if not exists idx_sops_property_created on sops(property_id, created_at desc);
