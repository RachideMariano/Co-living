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
2. ✅ Inquilinos — CRUD + checklist de onboarding + checkout + lembrete de caução
3. ✅ Pagamentos — grelha mensal (pendente→pago→atrasado) + "marcar mês todo pago"
4. ✅ Alertas automáticos — comunicação ao senhorio (15 dias), rendas em falta,
   contratos a expirar, manutenções urgentes (`src/lib/alerts.ts`)
5. ✅ Manutenção — tickets com fecho a gerar despesa automaticamente
6. ✅ Despesas — por apartamento/categoria
7. ✅ Dashboard — KPIs, alertas em destaque, gráfico de receita cobrada
   (últimos 12 meses, a partir de `payments`), tabela de apartamentos
8. ✅ Mensagens — templates (renda/boas-vindas/vistoria/personalizada),
   WhatsApp (wa.me), email, copiar (`src/lib/messages.ts` +
   `MessageModal`, partilhado com Alertas)
9. ✅ Relatórios — P&L mensal por apartamento (receita cobrada real via
   `payments`, não a renda atual) + export CSV
10. ✅ Interessados (leads) — CRUD + conversão em inquilino (cria tenant e
    marca o lead como convertido)

Todos os módulos do plano inicial estão implementados. Por testar/validar
com dados reais; ainda por fazer nesta fase: deploy (Vercel/Netlify),
subscrições Realtime no frontend (a tabela já está preparada), paginação
para quando a lista de inquilinos passar de ~80.

## Extensões (ver `supabase/migrations/0002_features.sql` e `0003_weekly_digest.sql`)
- `landlords` — senhorio como entidade própria (`properties.landlord_id`);
  colunas antigas `landlord_name`/`landlord_contact` ficam por compatibilidade
  mas deixam de ser escritas pela UI
- `tenants.guarantor_*` — fiador/garante (nome, contacto, relação)
- `utility_bills` — reconciliação utilities real vs. estimado, editável
  inline em Relatórios (`UtilityBillCell`)
- `maintenance_schedules` — manutenção preventiva recorrente, gera alerta
  quando a `next_due` está a ≤14 dias ou atrasada
- `documents` + bucket privado `documents` no Storage — anexos por
  inquilino/apartamento (`DocumentsSection`, URLs assinadas, nunca públicas)
- `inspections` — vistorias de entrada/saída com fotos (`InspectionsSection`,
  mesmo bucket)
- Página `/calendario` — agrega fim de contratos, vistorias e manutenção
  preventiva num grid mensal, sem tabela própria (deriva de outras tabelas)
- PWA (`vite-plugin-pwa`) — instalável no telemóvel; ícone atual é SVG
  (`public/pwa-icon.svg`) — funciona em Android/Chrome, iOS/Safari tem
  suporte limitado a ícones SVG em "Adicionar ao ecrã principal" e pode
  não mostrar o ícone correto; gerar PNGs 192/512 é o próximo passo se isso
  incomodar
- Resumo semanal por email — `weekly_digest()` corre via `pg_cron` +
  `pg_net` diretamente na base de dados (sem Edge Function), envia por
  Resend. Requer secret `resend_api_key` no Supabase Vault
  (`select vault.create_secret('re_...', 'resend_api_key');`) e a lista
  `recipients` dentro da função ajustada aos emails reais — sem isso a
  função sai silenciosamente sem enviar nada.

## Comandos
```
npm run dev      # servidor de desenvolvimento
npm run build    # type-check (tsc -b) + build de produção
npm run lint      # oxlint
```

Variáveis de ambiente em `.env` (ver `.env.example`):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
