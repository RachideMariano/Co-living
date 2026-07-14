import { useEffect, useState } from 'react'
import PageHead from '../components/PageHead'
import Empty from '../components/Empty'
import { Button } from '../components/Button'
import Modal from '../components/Modal'
import { Field, Input } from '../components/Field'
import { useToast } from '../context/ToastContext'
import { createLandlord, deleteLandlord, listLandlords, updateLandlord, type Landlord, type LandlordInput } from '../lib/api/landlords'
import { listProperties, type Property } from '../lib/api/properties'

const emptyForm: LandlordInput = { name: '', contact: '', notes: '' }

export default function Landlords() {
  const [landlords, setLandlords] = useState<Landlord[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Landlord | null | 'new'>(null)
  const toast = useToast()

  const refresh = async () => {
    const [l, p] = await Promise.all([listLandlords(), listProperties()])
    setLandlords(l); setProperties(p); setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const propsOf = (landlordId: string) => properties.filter(p => p.landlord_id === landlordId)

  if (loading) return <PageHead title="Senhorios" subtitle="A carregar…" />

  return (
    <>
      <PageHead
        title="Senhorios"
        subtitle={`${landlords.length} senhorios`}
        action={<Button variant="primary" onClick={() => setEditing('new')}>+ Adicionar senhorio</Button>}
      />
      {landlords.length === 0 ? (
        <Empty icon="🧑" title="Nenhum senhorio registado." />
      ) : (
        landlords.map(l => (
          <div key={l.id} className="card p-5 mb-3 cursor-pointer" onClick={() => setEditing(l)}>
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <div className="text-[16px] font-bold">{l.name}</div>
                {l.contact && <div className="text-[13px] text-[var(--ink-3)] font-medium mt-0.5">{l.contact}</div>}
              </div>
              <div className="text-xs text-[var(--ink-3)] font-semibold">
                {propsOf(l.id).length} apartamento{propsOf(l.id).length !== 1 ? 's' : ''}
              </div>
            </div>
            {propsOf(l.id).length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-3">
                {propsOf(l.id).map(p => (
                  <span key={p.id} className="text-xs bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-full font-medium">{p.name}</span>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {editing && (
        <LandlordModal
          landlord={editing === 'new' ? null : editing}
          hasProperties={editing !== 'new' && propsOf(editing.id).length > 0}
          onClose={() => setEditing(null)}
          onSaved={async () => { await refresh(); setEditing(null) }}
          toast={toast}
        />
      )}
    </>
  )
}

function LandlordModal({ landlord, hasProperties, onClose, onSaved, toast }: {
  landlord: Landlord | null; hasProperties: boolean; onClose: () => void; onSaved: () => void; toast: (m: string) => void
}) {
  const [form, setForm] = useState<LandlordInput>(
    landlord ? { name: landlord.name, contact: landlord.contact ?? '', notes: landlord.notes ?? '' } : emptyForm
  )
  const [saving, setSaving] = useState(false)

  const set = (k: keyof LandlordInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    if (!form.name) { toast('Indica o nome do senhorio'); return }
    setSaving(true)
    try {
      if (landlord) await updateLandlord(landlord.id, form)
      else await createLandlord(form)
      toast(landlord ? 'Senhorio atualizado' : 'Senhorio adicionado')
      onSaved()
    } catch (e) {
      toast('Erro ao guardar: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!landlord) return
    if (hasProperties) { toast('Este senhorio tem apartamentos associados — muda-os primeiro.'); return }
    if (!confirm('Eliminar este senhorio?')) return
    await deleteLandlord(landlord.id)
    toast('Senhorio eliminado')
    onSaved()
  }

  return (
    <Modal
      title={landlord ? 'Editar senhorio' : 'Novo senhorio'}
      onClose={onClose}
      footer={<>
        {landlord && <Button variant="danger" onClick={remove}>Eliminar</Button>}
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={saving} onClick={save}>Guardar</Button>
      </>}
    >
      <Field label="Nome"><Input value={form.name} onChange={set('name')} /></Field>
      <Field label="Contacto"><Input value={form.contact ?? ''} onChange={set('contact')} placeholder="Telefone ou email" /></Field>
      <Field label="Notas">
        <textarea
          value={form.notes ?? ''} onChange={set('notes')}
          className="w-full rounded-[13px] border border-black/10 dark:border-white/10 bg-white/75 dark:bg-white/5 px-3.5 py-3 text-sm min-h-24 resize-y"
        />
      </Field>
    </Modal>
  )
}
