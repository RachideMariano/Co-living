import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHead from '../components/PageHead'
import Empty from '../components/Empty'
import { Button } from '../components/Button'
import Modal from '../components/Modal'
import MessageModal from '../components/MessageModal'
import { useToast } from '../context/ToastContext'
import { computeAlerts, type Alert } from '../lib/alerts'
import { landlordMessage, copyText, mailtoUrl } from '../lib/messages'
import { listProperties, type Property } from '../lib/api/properties'
import { listTenants, type Tenant } from '../lib/api/tenants'
import { listOnboarding, updateOnboarding, type Onboarding } from '../lib/api/onboarding'
import { listPayments, markMonthPaid, type Payment } from '../lib/api/payments'
import { listMaintenanceTickets, type MaintenanceTicket } from '../lib/api/maintenance'

const levelCls: Record<Alert['level'], string> = {
  urgent: 'border-l-4 border-[var(--color-red)]',
  warn: 'border-l-4 border-[var(--color-orange)]',
  info: 'border-l-4 border-[var(--color-blue)]',
}
const levelIcoBg: Record<Alert['level'], string> = {
  urgent: 'linear-gradient(145deg,#ff6961,#e5372c)',
  warn: 'linear-gradient(145deg,#ffb340,#f08b00)',
  info: 'linear-gradient(145deg,#5ac8fa,#0a84ff)',
}

export default function Alerts() {
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [onboarding, setOnboarding] = useState<Onboarding[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [messageFor, setMessageFor] = useState<Tenant | null>(null)
  const [landlordFor, setLandlordFor] = useState<Tenant | null>(null)
  const toast = useToast()
  const nav = useNavigate()

  const refresh = async () => {
    const [p, t, o, pay, tk] = await Promise.all([
      listProperties(), listTenants(), listOnboarding(), listPayments(), listMaintenanceTickets(),
    ])
    setProperties(p); setTenants(t); setOnboarding(o); setPayments(pay); setTickets(tk)
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  if (loading) return <PageHead title="Alertas" subtitle="A carregar…" />

  const alerts = computeAlerts(properties, tenants, onboarding, payments, tickets)
  const tenantById = (id?: string) => tenants.find(t => t.id === id)
  const propertyById = (id?: string) => properties.find(p => p.id === id)

  const markCommunicated = async (tenantId: string) => {
    await updateOnboarding(tenantId, { landlord_notified: true })
    toast('Marcado como comunicado ✓')
    refresh()
  }
  const markPaid = async (tenantId: string) => {
    const t = tenantById(tenantId)
    if (!t) return
    const now = new Date()
    await markMonthPaid(tenantId, now.getFullYear(), now.getMonth() + 1, t.rent)
    toast('Marcado como pago ✓')
    refresh()
  }

  return (
    <>
      <PageHead title="Alertas" subtitle="Datas críticas e obrigações legais" />
      {alerts.length === 0 ? (
        <Empty icon="✓" title="Tudo em ordem!" subtitle="Nenhum alerta ativo neste momento." />
      ) : (
        alerts.map((a, i) => {
          const t = tenantById(a.tenantId)
          return (
            <div key={i} className={`card flex items-start gap-3.5 p-[17px_19px] mb-3 ${levelCls[a.level]}`}>
              <div className="w-[38px] h-[38px] rounded-xl flex items-center justify-center text-[17px] text-white shrink-0" style={{ background: levelIcoBg[a.level] }}>
                {a.ico}
              </div>
              <div className="flex-1">
                <div className="text-[14.5px] font-bold">{a.title}</div>
                <div className="text-[12.5px] text-[var(--ink-2)] font-medium mt-0.5">{a.desc}</div>
                <div className="flex gap-2 flex-wrap mt-2.5">
                  {a.type === 'landlord_comm' && t && (
                    <>
                      <Button variant="primary" onClick={() => markCommunicated(t.id)}>Marcar como comunicado</Button>
                      <Button onClick={() => setLandlordFor(t)}>Gerar mensagem ao senhorio</Button>
                    </>
                  )}
                  {a.type === 'payment' && t && (
                    <>
                      <Button variant="primary" onClick={() => markPaid(t.id)}>Marcar como pago</Button>
                      <Button onClick={() => setMessageFor(t)}>Lembrar inquilino</Button>
                    </>
                  )}
                  {a.type === 'contract_end' && <Button onClick={() => nav('/inquilinos')}>Ver detalhes</Button>}
                  {a.type === 'prop_contract' && <Button onClick={() => nav('/apartamentos')}>Ver detalhes</Button>}
                  {a.type === 'maintenance' && <Button onClick={() => nav('/manutencao')}>Ver manutenção</Button>}
                </div>
              </div>
            </div>
          )
        })
      )}

      {messageFor && (
        <MessageModal
          tenant={messageFor} property={propertyById(messageFor.property_id)} defaultType="rent_reminder"
          onClose={() => setMessageFor(null)}
        />
      )}
      {landlordFor && (
        <LandlordMessageModal
          tenant={landlordFor} property={propertyById(landlordFor.property_id)}
          onClose={() => setLandlordFor(null)}
          onCommunicated={() => { markCommunicated(landlordFor.id); setLandlordFor(null) }}
        />
      )}
    </>
  )
}

function LandlordMessageModal({ tenant, property, onClose, onCommunicated }: {
  tenant: Tenant; property: Property | undefined; onClose: () => void; onCommunicated: () => void
}) {
  const [text, setText] = useState(property ? landlordMessage(tenant, property) : '')
  const toast = useToast()

  return (
    <Modal
      title="Comunicação ao senhorio"
      onClose={onClose}
      footer={<>
        <Button onClick={() => copyText(text).then(() => toast('Copiado ✓'))}>Copiar</Button>
        <Button onClick={() => window.open(mailtoUrl(property?.landlord_contact, 'Comunicação de subarrendamento', text), '_blank')}>Email</Button>
        <Button variant="primary" onClick={onCommunicated}>Marcar comunicado ✓</Button>
      </>}
    >
      <p className="text-[13px] text-[var(--ink-3)] font-medium mb-3.5">
        Comunicação legal obrigatória (15 dias, art. 1088.º CC). Envia por email ou carta registada e guarda o comprovativo.
      </p>
      <textarea
        value={text} onChange={e => setText(e.target.value)}
        className="w-full rounded-[13px] border border-black/10 dark:border-white/10 bg-white/75 dark:bg-white/5 px-3.5 py-3 text-sm min-h-48 resize-y"
      />
    </Modal>
  )
}
