**Co-living OS Pro — Standard Operating Procedures (SOP)**

**Objetivo**
- Fornecer passos claros e reprodutíveis para operar, abrir, construir, e publicar a aplicação, bem como gerir dados na cloud.

**Escopo**
- Desenvolvimento local, execução estática no desktop, build de produção, deploy estático, configurações do Supabase, backups e restauração.

**Pré-requisitos**
- Node.js (>=18) e npm, ou Python 3 para servidor estático.
- Acesso ao projeto: clone de `git` para a pasta do projecto.

**Abrir a app (desenvolvimento)**
- Instalar dependências e correr o servidor Vite:

```bash
npm install
npm run dev
# Abrir: http://localhost:5173/#/login
```

**Abrir a app (desktop / versão estática)**
- Gerar build de produção e servir os ficheiros estáticos:

```bash
npm run build
npx http-server dist -p 5173   # ou
python -m http.server 5173 --directory dist
# Abrir: http://127.0.0.1:5173/
```
- Alternativa para utilizadores Windows: use o atalho `abrir_app.bat` (na raiz do repositório) ou o atalho de desktop `Abrir_Coliving.bat`.

**Notas sobre abrir via file://**
- Não abrir `index.html` da raiz com `file://` (vai apontar para `/src/main.tsx` e ficar branco). Usar sempre a versão em `dist/` servida por HTTP ou via o `.bat` criado.

**Build e testes rápidos antes de publicar**
- Compilar e verificar console do browser para erros:

```bash
npm run build
# depois abrir via servidor e verificar DevTools → Console
```

**Deploy estático (opções)**
- Netlify / Vercel: ligar repositório GitHub → definir `Build command: npm run build` e `Publish directory: dist`.
- GitHub Pages: publicar conteúdo de `dist/` para branch `gh-pages` (use `gh-pages` npm package ou GitHub Actions).
- S3 + CloudFront / Firebase Hosting: servir `dist/` como ficheiros estáticos.

**Variáveis de ambiente (Supabase)**
- Assegurar que o host tem as env vars necessárias: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- No Netlify/Vercel: Project Settings → Environment Variables → adicionar essas chaves.

**Migrations e schema (Supabase)**
- Ficheiros SQL em `supabase/migrations/` (ex.: `0004_receipts.sql`, `0005_expense_allocations.sql`).
- Executar manualmente na consola SQL do Supabase ou usar a CLI `supabase` para aplicar.

**Onde os dados ficam na cloud**
- Postgres (Supabase) armazena tabelas: receipts, expenses, tenants, properties, expense_allocations, etc.
- Storage (Supabase) armazena ficheiros/uploads no bucket `documents` (ver `src/lib/api/documents.ts`).

**Backups e restauração**
- Postgres: usar export SQL no dashboard do Supabase ou agendar backups (export CSV/SQL).
- Storage: sincronizar bucket para S3/local via `supabase` CLI ou script que faça `download` periódico.

**Rotina de segurança**
- Não expor PATs em chat; armazenar tokens no Secret Manager do serviço ou no próprio Netlify/Vercel.
- Rotacionar chaves periodicamente e revogar PATs que já não são usados.

**Resolução de problemas comuns**
- Página branca: verificar se abriu `file://` errado; servir `dist/` por HTTP.
- Erros de build / parse: verificar `src/pages/Login.tsx` e mensagens do Vite; corrija sintaxe e reinicie a build.
- Falha ao comunicar com Supabase: checar env vars e permissões do anon key.

**Contatos e responsabilidades**
- Proprietário do projecto: (inserir nome/email).
- Para operações de deploy e mudanças de env vars: usar conta centralizada e registar alterações.

**Histórico de alterações**
- Registar data, quem executou e o que foi alterado (ex.: migração aplicada, deploy, rotação de chaves).

---

Por favor reveja o SOP e diga se quer que eu o torne mais detalhado por secção (ex.: procedimentos passo-a-passo para aplicar migrations via CLI, ou scripts automatizados para backup).