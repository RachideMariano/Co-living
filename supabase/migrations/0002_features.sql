-- Co-living OS Pro — 10 funcionalidades adicionais:
-- landlords, guarantor fields, utility_bills, maintenance_schedules,
-- documents + storage, inspections + storage

-- ═══════════ landlords (senhorios como entidade própria) ═══════════
create table landlords (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  notes text,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger landlords_set_updated_at before update on landlords
  for each row execute function set_updated_at();

alter table properties add column landlord_id uuid references landlords(id) on delete set null;

-- migra os senhorios já escritos como texto em properties para a nova tabela
insert into landlords (name, contact)
select distinct landlord_name, nullif(landlord_contact, '')
from properties
where landlord_name is not null and landlord_name <> '';

update properties p
set landlord_id = l.id
from landlords l
where p.landlord_name = l.name
  and coalesce(p.landlord_contact, '') = coalesce(l.contact, '');

-- ═══════════ fiador do inquilino ═══════════
alter table tenants add column guarantor_name text;
alter table tenants add column guarantor_contact text;
alter table tenants add column guarantor_relationship text;

-- ═══════════ reconciliação de utilities (real vs. estimado) ═══════════
create table utility_bills (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  amount numeric not null,
  notes text,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now(),
  unique (property_id, year, month)
);
create index utility_bills_property_idx on utility_bills(property_id);

-- ═══════════ manutenção preventiva recorrente ═══════════
create table maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  title text not null,
  frequency_months int not null default 12,
  last_done date,
  next_due date not null,
  notes text,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index maintenance_schedules_property_idx on maintenance_schedules(property_id);
create trigger maintenance_schedules_set_updated_at before update on maintenance_schedules
  for each row execute function set_updated_at();

-- ═══════════ documentos anexados (contrato, caução, identificação…) ═══════════
create table documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  category text not null default 'outro',
  file_path text not null,
  file_name text not null,
  uploaded_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now(),
  constraint documents_owner check (tenant_id is not null or property_id is not null)
);
create index documents_tenant_idx on documents(tenant_id);
create index documents_property_idx on documents(property_id);

-- ═══════════ vistorias de entrada/saída com fotos ═══════════
create table inspections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  type text not null check (type in ('move_in', 'move_out')),
  date date not null default current_date,
  notes text,
  photos text[] not null default '{}',
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now()
);
create index inspections_tenant_idx on inspections(tenant_id);

-- ═══════════ RLS: mesmo modelo partilhado das restantes tabelas ═══════════
alter table landlords enable row level security;
alter table utility_bills enable row level security;
alter table maintenance_schedules enable row level security;
alter table documents enable row level security;
alter table inspections enable row level security;

do $$
declare t text;
begin
  foreach t in array array['landlords','utility_bills','maintenance_schedules','documents','inspections']
  loop
    execute format('create policy "authenticated_all" on %I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')', t);
  end loop;
end $$;

-- ═══════════ Storage: bucket privado para documentos/fotos ═══════════
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "authenticated_read_documents" on storage.objects
  for select using (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "authenticated_write_documents" on storage.objects
  for insert with check (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "authenticated_update_documents" on storage.objects
  for update using (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "authenticated_delete_documents" on storage.objects
  for delete using (bucket_id = 'documents' and auth.role() = 'authenticated');
