# Co-living OS Pro

Gestão de operações de co-living no Porto (rental arbitrage: arrendamos T3s a
senhorios e subarrendamos por cama a inquilinos). Migração do protótipo
HTML único (`coliving_os.html`, na pasta OneDrive original) para app real
multi-utilizador com base de dados na cloud.

## Stack
- **Frontend**: React 19 + Vite + TypeScript, React Router v7, Tailwind CSS v4
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **Deploy**: Vercel ou Netlify (por decidir)
- **Design**: glassmorphism estilo Apple/visionOS, dark mode automático
  (`prefers-color-scheme`), tilt 3D nos cards (`useTilt` hook)

O projeto vive fora do OneDrive (`C:\Users\rachi\dev\coliving-os-pro`) para
evitar problemas de sincronização com `node_modules`.

## Utilizadores
2 contas partilhadas (dono + co-founder), mesmos dados em tempo real. Login
por email/password via Supabase Auth. **Não é multi-tenant** — todos os
utilizadores autenticados veem e editam os mesmos dados (RLS policy única
`authenticated_all` em todas as tabelas).

## Schema (ver `supabase/migrations/0001_init.sql`)
- `properties` — apartamentos (senhorio, renda, utilities, contrato)
- `beds` — camas de cada apartamento
- `tenants` — inquilinos (renda, caução, cama atribuída, status active/inactive)
- `tenant_onboarding` — checklist de 6 passos (1:1 com tenant, criado
  automaticamente via trigger ao inserir um tenant)
- `payments` — grelha mensal por inquilino/ano/mês (`amount` é snapshot, não
  recalculado a partir de `tenants.rent`)
- `maintenance_tickets` — tickets de manutenção (aberto/em_curso/concluído)
- `expenses` — despesas por apartamento/categoria (alimenta o P&L)
- `leads` — interessados / lista de espera
- `app_settings` — linha única (id=1) com defaults (ex: `utilities_default`)

**Regras de integridade importantes:**
- Uma cama só pode ter 1 inquilino ativo: unique index parcial
  `one_active_tenant_per_bed` em `tenants(bed_id) where status='active'`.
- Alertas **não são guardados em tabela** — são sempre calculados on-the-fly
  a partir de `properties`/`tenants`/`payments` (ver `lib/business.ts` e o
  módulo de Alertas). Relatórios/P&L seguem o mesmo princípio: queries
  agregadas, não tabelas derivadas.

Depois de aplicar a migração no teu projeto Supabase, regenera os tipos reais:
```
npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
```
(o ficheiro atual foi escrito à mão para arrancar o projeto sem depender do CLI).

## Regras de negócio críticas
- **Comunicação ao senhorio (art. 1088.º CC)**: prazo legal de 15 dias após
  `tenants.move_in` para comunicar o subarrendamento. Isto é o alerta mais
  importante da app — nunca o simplificar ou remover.
- Margem por apartamento = receita cobrada (soma das rendas dos inquilinos
  ativos) − renda ao senhorio (`head_rent`) − `utilities` − despesas do mês.
- Ao marcar saída de um inquilino (`status='inactive'`, `move_out` preenchido):
  a cama liberta-se automaticamente (não há mais tenant ativo naquele
  `bed_id`) e deve aparecer lembrete para devolver a caução
  (`deposit_returned`).
- Recibos fiscais oficiais são emitidos no Portal das Finanças — a app só
  gera comprovativo/mensagem interna, nunca um recibo fiscal.

## Convenções do projeto
- Texto da UI em português de Portugal.
- Sem gestor de estado global nem React Query — fetch direto com
  `supabase-js` + `useState`/`useEffect` e refetch manual após mutações
  (dataset pequeno, 2 utilizadores; reconsiderar só se a complexidade dos
  módulos de pagamentos/relatórios justificar).
- Lógica de negócio partilhada (receita/margem/ocupação) vive em
  `src/lib/business.ts` — não duplicar cálculos dentro dos componentes de
  página.
- Chamadas Supabase isoladas em `src/lib/api/<entidade>.ts`, nunca chamadas
  diretas a `supabase.from(...)` dentro de componentes de página.
- Componentes de UI genéricos (`Button`, `Field`, `Modal`, `Pill`, `Empty`,
  `PageHead`) em `src/components/` — reutilizar em vez de estilar inline.
- Migrações SQL versionadas em `supabase/migrations/`, nunca alterar o
  schema diretamente no dashboard sem criar a migração correspondente.

## Estado da migração (módulo a módulo, por prioridade)
1. ✅ Apartamentos — CRUD + gestão de camas
2. ⬜ Inquilinos — CRUD + checklist de onboarding + checkout
3. ⬜ Pagamentos — grelha mensal
4. ⬜ Alertas automáticos
5. ⬜ Manutenção
6. ⬜ Despesas
7. 🟡 Dashboard — versão mínima feita (KPIs + tabela); falta gráfico 12 meses e alertas
8. ⬜ Mensagens
9. ⬜ Relatórios (P&L + export CSV)
10. ⬜ Interessados (leads)

## Comandos
```
npm run dev      # servidor de desenvolvimento
npm run build    # type-check (tsc -b) + build de produção
npm run lint      # oxlint
```

Variáveis de ambiente em `.env` (ver `.env.example`):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
