-- Co-living OS Pro — schema inicial
-- Modelo de acesso: workspace único partilhado entre todos os utilizadores autenticados
-- (2 contas, mesmos dados). Sem isolamento multi-tenant.

create extension if not exists pgcrypto;

-- ═══════════ updated_at trigger genérico ═══════════
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ═══════════ properties ═══════════
create table properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  landlord_name text,
  landlord_contact text,
  head_rent numeric not null default 0,
  utilities numeric not null default 0,
  contract_start date,
  contract_end date,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger properties_set_updated_at before update on properties
  for each row execute function set_updated_at();

-- ═══════════ beds ═══════════
create table beds (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);
create index beds_property_id_idx on beds(property_id);

-- ═══════════ tenants ═══════════
create table tenants (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  bed_id uuid references beds(id) on delete set null,
  name text not null,
  contact text,
  rent numeric not null default 0,
  deposit numeric not null default 0,
  deposit_returned boolean not null default false,
  move_in date,
  move_out date,
  contract_end date,
  status text not null default 'active' check (status in ('active','inactive')),
  notes text,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tenants_property_id_idx on tenants(property_id);
create index tenants_bed_id_idx on tenants(bed_id);
create index tenants_status_idx on tenants(status);
-- uma cama só pode ter 1 inquilino ativo
create unique index one_active_tenant_per_bed on tenants(bed_id) where status = 'active' and bed_id is not null;
create trigger tenants_set_updated_at before update on tenants
  for each row execute function set_updated_at();

-- ═══════════ tenant_onboarding (checklist de 6 passos) ═══════════
create table tenant_onboarding (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  contract_signed boolean not null default false,
  inventory_done boolean not null default false,
  deposit_paid boolean not null default false,
  id_document_received boolean not null default false,
  landlord_notified boolean not null default false,
  landlord_notified_at timestamptz,
  direct_debit_setup boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger tenant_onboarding_set_updated_at before update on tenant_onboarding
  for each row execute function set_updated_at();

-- cria automaticamente a linha de onboarding ao criar um inquilino
create or replace function create_tenant_onboarding()
returns trigger as $$
begin
  insert into tenant_onboarding (tenant_id) values (new.id);
  return new;
end;
$$ language plpgsql;
create trigger tenants_create_onboarding after insert on tenants
  for each row execute function create_tenant_onboarding();

-- ═══════════ payments ═══════════
create table payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  status text not null default 'pending' check (status in ('pending','paid','late')),
  amount numeric not null,
  paid_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, year, month)
);
create index payments_tenant_id_idx on payments(tenant_id);
create index payments_year_month_idx on payments(year, month);
create trigger payments_set_updated_at before update on payments
  for each row execute function set_updated_at();

-- ═══════════ maintenance_tickets ═══════════
create table maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','in_progress','done')),
  priority text not null default 'normal' check (priority in ('normal','urgent')),
  cost numeric,
  opened_at date not null default current_date,
  closed_at date,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index maintenance_property_id_idx on maintenance_tickets(property_id);
create index maintenance_status_idx on maintenance_tickets(status);
create trigger maintenance_set_updated_at before update on maintenance_tickets
  for each row execute function set_updated_at();

-- ═══════════ expenses ═══════════
create table expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  category text not null,
  description text,
  amount numeric not null,
  date date not null,
  maintenance_id uuid references maintenance_tickets(id) on delete set null,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now()
);
create index expenses_property_id_idx on expenses(property_id);
create index expenses_date_idx on expenses(date);

-- ═══════════ leads (interessados) ═══════════
create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  desired_move_in date,
  budget numeric,
  property_id uuid references properties(id) on delete set null,
  notes text,
  status text not null default 'waiting' check (status in ('waiting','contacted','converted','discarded')),
  converted_tenant_id uuid references tenants(id) on delete set null,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger leads_set_updated_at before update on leads
  for each row execute function set_updated_at();

-- ═══════════ app_settings (linha única) ═══════════
create table app_settings (
  id int primary key default 1,
  utilities_default numeric not null default 250,
  constraint single_row check (id = 1)
);
insert into app_settings (id, utilities_default) values (1, 250);

-- ═══════════ RLS: workspace partilhado, qualquer utilizador autenticado ═══════════
alter table properties enable row level security;
alter table beds enable row level security;
alter table tenants enable row level security;
alter table tenant_onboarding enable row level security;
alter table payments enable row level security;
alter table maintenance_tickets enable row level security;
alter table expenses enable row level security;
alter table leads enable row level security;
alter table app_settings enable row level security;

do $$
declare t text;
begin
  foreach t in array array['properties','beds','tenants','tenant_onboarding','payments','maintenance_tickets','expenses','leads','app_settings']
  loop
    execute format('create policy "authenticated_all" on %I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')', t);
  end loop;
end $$;

-- ═══════════ Realtime ═══════════
alter publication supabase_realtime add table properties;
alter publication supabase_realtime add table tenants;
alter publication supabase_realtime add table payments;
alter publication supabase_realtime add table maintenance_tickets;
