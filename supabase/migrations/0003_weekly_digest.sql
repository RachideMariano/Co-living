-- Resumo semanal por email — corre inteiramente na base de dados via pg_cron + pg_net,
-- sem precisar de Edge Functions nem do Supabase CLI.
--
-- PASSOS MANUAIS depois de correr este ficheiro (não podem ser automatizados por SQL):
--   1. Cria conta grátis em https://resend.com e verifica o teu email de envio
--      (ou usa o domínio de teste onboarding@resend.dev)
--   2. Gera uma API key em https://resend.com/api-keys
--   3. Corre este UPDATE com a tua key e destinatários reais:
--      select vault.create_secret('re_XXXXXXXX', 'resend_api_key');
--   4. Ajusta a lista DIGEST_RECIPIENTS mais abaixo com os emails de vocês

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault;

-- ═══════════ função que calcula os alertas e envia o email ═══════════
create or replace function weekly_digest()
returns void
language plpgsql
security definer
as $$
declare
  resend_key text;
  recipients text[] := array['rachid.mariano1@gmail.com']; -- ajusta aqui os emails de destino
  landlord_comm_count int;
  payment_count int;
  contract_count int;
  maintenance_count int;
  total int;
  body_html text;
  today date := current_date;
  dom int := extract(day from current_date);
  cy int := extract(year from current_date);
  cm int := extract(month from current_date);
begin
  select decrypted_secret into resend_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if resend_key is null then
    raise notice 'resend_api_key não configurada em vault — a saltar envio de email.';
    return;
  end if;

  select count(*) into landlord_comm_count
  from tenants t
  join tenant_onboarding o on o.tenant_id = t.id
  where t.status = 'active' and t.move_in is not null and o.landlord_notified = false
    and (today - t.move_in) <= 15;

  select count(*) into payment_count
  from tenants t
  where t.status = 'active' and dom >= 8
    and not exists (
      select 1 from payments p where p.tenant_id = t.id and p.year = cy and p.month = cm and p.status = 'paid'
    );

  select count(*) into contract_count
  from (
    select 1 from tenants where status = 'active' and contract_end is not null
      and contract_end between today and today + interval '60 days'
    union all
    select 1 from properties where contract_end is not null
      and contract_end between today and today + interval '120 days'
  ) x;

  select count(*) into maintenance_count
  from (
    select 1 from maintenance_tickets where priority = 'urgent' and status <> 'done'
    union all
    select 1 from maintenance_schedules where next_due <= today + interval '14 days'
  ) x;

  total := landlord_comm_count + payment_count + contract_count + maintenance_count;

  if total = 0 then
    body_html := '<p>Tudo em ordem esta semana — nenhum alerta ativo. ✅</p>';
  else
    body_html := format(
      '<h2>Resumo semanal — Co-living OS Pro</h2><ul>' ||
      '<li><b>%s</b> comunicações ao senhorio pendentes (prazo 15 dias, art. 1088.º CC)</li>' ||
      '<li><b>%s</b> rendas em falta</li>' ||
      '<li><b>%s</b> contratos a terminar em breve</li>' ||
      '<li><b>%s</b> itens de manutenção urgentes/atrasados</li>' ||
      '</ul><p>Total: <b>%s</b> alertas. Abre a app para ver detalhes e agir.</p>',
      landlord_comm_count, payment_count, contract_count, maintenance_count, total
    );
  end if;

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || resend_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', 'Co-living OS Pro <onboarding@resend.dev>',
      'to', to_jsonb(recipients),
      'subject', case when total = 0 then 'Co-living OS · tudo em ordem esta semana' else format('Co-living OS · %s alertas esta semana', total) end,
      'html', body_html
    )
  );
end;
$$;

-- ═══════════ agendamento: todas as segundas-feiras às 8h ═══════════
select cron.schedule('weekly-digest', '0 8 * * 1', $$ select weekly_digest(); $$);
