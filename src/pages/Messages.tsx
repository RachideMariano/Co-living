import { useEffect, useState } from 'react'
import PageHead from '../components/PageHead'
import { Select } from '../components/Field'
import MessageModal from '../components/MessageModal'
import { listTenants, type Tenant } from '../lib/api/tenants'
import { listProperties, type Property } from '../lib/api/properties'
import type { MessageTemplate } from '../lib/messages'

const TEMPLATES: { type: MessageTemplate; title: string; desc: string; ico: string; bg: string }[] = [
  { type: 'rent_reminder', title: 'Lembrete de renda', desc: 'Lembra os inquilinos com renda pendente este mês.', ico: '€', bg: 'linear-gradient(145deg,#66dd7a,#28a745)' },
  { type: 'welcome', title: 'Boas-vindas / onboarding', desc: 'Mensagem de entrada com regras e informações da casa.', ico: '☺', bg: 'linear-gradient(145deg,#5ac8fa,#0a84ff)' },
  { type: 'inspection', title: 'Aviso de vistoria', desc: 'Avisa que vais fazer a vistoria mensal do apartamento.', ico: '🔍', bg: 'linear-gradient(145deg,#ffb340,#f08b00)' },
  { type: 'custom', title: 'Mensagem personalizada', desc: 'Escreve uma mensagem à medida para qualquer inquilino.', ico: '✏', bg: 'linear-gradient(145deg,#8f79f2,#bf5af2)' },
]

export default function Messages() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [defaultType, setDefaultType] = useState<MessageTemplate | null>(null)
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null)

  useEffect(() => {
    Promise.all([listTenants(), listProperties()]).then(([t, p]) => { setTenants(t); setProperties(p) })
  }, [])

  const active = tenants.filter(t => t.status === 'active')
  const propById = (id: string) => properties.find(p => p.id === id)

  const openTemplate = (type: MessageTemplate) => {
    if (active.length === 0) return
    setDefaultType(type)
    setActiveTenant(active[0])
  }

  return (
    <>
      <PageHead title="Mensagens" subtitle="Mensagens automáticas para inquilinos e senhorios" />

      <div className="text-[13px] font-bold uppercase tracking-wide text-[var(--ink-3)] mb-3.5">Modelos rápidos</div>
      {TEMPLATES.map(tpl => (
        <div
          key={tpl.type} onClick={() => openTemplate(tpl.type)}
          className="card flex items-center gap-4 p-[17px_19px] mb-3 cursor-pointer hover:-translate-y-0.5 transition-transform"
        >
          <div className="w-[42px] h-[42px] rounded-2xl flex items-center justify-center text-[19px] text-white shrink-0" style={{ background: tpl.bg }}>{tpl.ico}</div>
          <div>
            <div className="text-[15px] font-bold">{tpl.title}</div>
            <div className="text-[12.5px] text-[var(--ink-2)] font-medium mt-0.5">{tpl.desc}</div>
          </div>
          <span className="ml-auto text-[var(--ink-3)] text-base">›</span>
        </div>
      ))}

      <div className="text-[13px] font-bold uppercase tracking-wide text-[var(--ink-3)] mt-8 mb-3.5">Enviar a um inquilino específico</div>
      <div className="card p-5">
        <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5">Escolher inquilino</label>
        <Select defaultValue="" onChange={e => {
          const t = active.find(x => x.id === e.target.value)
          if (t) { setDefaultType('custom'); setActiveTenant(t) }
        }}>
          <option value="">Selecionar…</option>
          {active.map(t => <option key={t.id} value={t.id}>{t.name} — {propById(t.property_id)?.name ?? ''}</option>)}
        </Select>
      </div>

      {activeTenant && defaultType && (
        <MessageModal
          tenant={activeTenant} property={propById(activeTenant.property_id)} defaultType={defaultType}
          onClose={() => { setActiveTenant(null); setDefaultType(null) }}
        />
      )}
    </>
  )
}
