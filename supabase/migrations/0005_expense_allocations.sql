-- Migração: tabela `expense_allocations` para guardar divisão de despesas por inquilino

create table if not exists expense_allocations (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  days int not null,
  share numeric not null,
  created_at timestamptz default now()
);

create index if not exists idx_expense_allocations_expense on expense_allocations(expense_id);
