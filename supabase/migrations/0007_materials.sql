-- 0007_materials.sql
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete set null,
  name text not null,
  quantity numeric not null default 0,
  unit text,
  location text,
  notes text,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists materials_property_idx on materials(property_id);
