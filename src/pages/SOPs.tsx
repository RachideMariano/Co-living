import { useEffect, useMemo, useState } from 'react'
import PageHead from '../components/PageHead'
import Empty from '../components/Empty'
import { Button } from '../components/Button'
import Modal from '../components/Modal'
import { Field, Input, Select, TextArea } from '../components/Field'
import { useToast } from '../context/ToastContext'
import { listProperties, type Property } from '../lib/api/properties'
import { listTenants, type Tenant } from '../lib/api/tenants'
import { listSops, createSop, type Sop } from '../lib/api/sops'
import { uploadDocument, DOC_CATEGORIES } from '../lib/api/documents'

export default function SOPs() {
  const [sops, setSops] = useState<Sop[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProp, setFilterProp] = useState('')
  const [editing, setEditing] = useState<null | 'new'>(null)
  const toast = useToast()

  const refresh = async () => {
    const [ps, ts] = await Promise.all([listProperties(), listTenants()])
    setProperties(ps); setTenants(ts)
    const s = await listSops()
    setSops(s)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  const filtered = useMemo(() => filterProp ? sops.filter(s => s.property_id === filterProp) : sops, [sops, filterProp])

  if (loading) return <PageHead title="SOPs" subtitle="A carregar…" />

  return (
    <>
      <PageHead title="Procedimentos (SOP)" subtitle={`${filtered.length} registos`} action={<Button variant="primary" onClick={() => setEditing('new')}>+ Novo SOP</Button>} />

      {properties.length > 0 && (
        <div className="mb-4">
          <Select value={filterProp} onChange={e => setFilterProp(e.target.value)} className="w-auto">
            <option value="">Todos os apartamentos</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </div>
      )}

      {filtered.length === 0 ? (
        <Empty icon="📝" title="Nenhum procedimento registado." />
      ) : (
        <div className="card p-2 overflow-x-auto">
          <table className="w-full text-[13.5px] border-collapse">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[var(--ink-3)] text-left">
                <th className="p-3.5 font-bold">Data</th>
                <th className="p-3.5 font-bold">Apartamento</th>
                <th className="p-3.5 font-bold">Título</th>
                <th className="p-3.5 font-bold">Estado</th>
                <th className="p-3.5 font-bold">Responsável</th>
                <th className="p-3.5 font-bold">Anexos</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-t border-black/5 dark:border-white/5 hover:bg-blue-500/5 cursor-pointer" onClick={() => window.open(`#/sops/${s.id}`, '_self')}>
                  <td className="p-3.5 text-[var(--ink-3)]">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="p-3.5">{properties.find(p => p.id === s.property_id)?.name ?? '—'}</td>
                  <td className="p-3.5">{s.title}</td>
                  <td className="p-3.5">{s.status}</td>
                  <td className="p-3.5">{s.created_by ?? '—'}</td>
                  <td className="p-3.5">{(s.documents || []).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing === 'new' && (
        <NewSopModal properties={properties} tenants={tenants} onClose={() => { setEditing(null); refresh() }} toast={toast} />
      )}
    </>
  )
}

function NewSopModal({ properties, tenants, onClose, toast }: { properties: Property[]; tenants: Tenant[]; onClose: () => void; toast: (m: string) => void }) {
  const [form, setForm] = useState({ property_id: properties[0]?.id ?? '', tenant_id: '', title: '', description: '', status: 'open' })
  const [files, setFiles] = useState<FileList | null>(null)
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    if (!form.property_id) { toast('Seleciona um apartamento'); return }
    if (!form.title) { toast('Indica um título'); return }
    setSaving(true)
    try {
      const created = await createSop({ ...form, tenant_id: form.tenant_id || null })
      if (files && files.length > 0 && created) {
        for (let i = 0; i < files.length; i++) {
          const f = files[i]
          await uploadDocument({ propertyId: created.property_id, category: DOC_CATEGORIES[7], file: f })
        }
      }
      toast('SOP criado')
      onClose()
    } catch (e) {
      toast('Erro: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Novo procedimento (SOP)" onClose={onClose} footer={<>
      <Button onClick={onClose}>Cancelar</Button>
      <Button variant="primary" disabled={saving} onClick={save}>Guardar</Button>
    </>}>
      <Field label="Apartamento">
        <Select value={form.property_id} onChange={set('property_id')}>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </Field>
      <Field label="Inquilino (opcional)"><Select value={form.tenant_id} onChange={set('tenant_id')}><option value="">—</option>{tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
      <Field label="Título"><Input value={form.title} onChange={set('title')} /></Field>
      <Field label="Descrição"><TextArea value={form.description} onChange={set('description')} /></Field>
      <Field label="Anexos">
        <input type="file" multiple onChange={e => setFiles(e.target.files)} />
      </Field>
    </Modal>
  )
}
