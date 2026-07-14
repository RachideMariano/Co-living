import { useState } from 'react'
import Modal from './Modal'
import { Button } from './Button'
import { Field, Select } from './Field'
import { useToast } from '../context/ToastContext'
import { buildMessage, copyText, mailtoUrl, whatsappUrl, type MessageTemplate } from '../lib/messages'
import type { Tenant } from '../lib/api/tenants'
import type { Property } from '../lib/api/properties'

export default function MessageModal({ tenant, property, defaultType, onClose }: {
  tenant: Tenant; property: Property | undefined; defaultType: MessageTemplate; onClose: () => void
}) {
  const [type, setType] = useState<MessageTemplate>(defaultType)
  const [text, setText] = useState(buildMessage(defaultType, tenant, property))
  const toast = useToast()

  const changeType = (t: MessageTemplate) => {
    setType(t)
    setText(buildMessage(t, tenant, property))
  }

  return (
    <Modal
      title={`Mensagem · ${tenant.name}`}
      onClose={onClose}
      footer={<>
        <Button onClick={() => copyText(text).then(() => toast('Copiado ✓'))}>Copiar texto</Button>
        <Button onClick={() => window.open(mailtoUrl(tenant.contact, 'Mensagem - Co-living', text), '_blank')}>Email</Button>
        <Button variant="primary" onClick={() => {
          const url = whatsappUrl(tenant.contact, text)
          if (!url) { toast('Sem número de telefone'); return }
          window.open(url, '_blank')
        }}>Enviar por WhatsApp</Button>
      </>}
    >
      <Field label="Modelo">
        <Select value={type} onChange={e => changeType(e.target.value as MessageTemplate)}>
          <option value="rent_reminder">Lembrete de renda</option>
          <option value="welcome">Boas-vindas</option>
          <option value="inspection">Aviso de vistoria</option>
          <option value="custom">Personalizada</option>
        </Select>
      </Field>
      <Field label="Mensagem">
        <textarea
          value={text} onChange={e => setText(e.target.value)}
          className="w-full rounded-[13px] border border-black/10 dark:border-white/10 bg-white/75 dark:bg-white/5 px-3.5 py-3 text-sm min-h-40 resize-y"
        />
      </Field>
      {!tenant.contact && <p className="text-xs text-[var(--color-orange)] font-semibold">⚠ Sem contacto guardado. Adiciona o número para enviar por WhatsApp.</p>}
    </Modal>
  )
}
