import { useEffect, useState } from 'react'
import PageHead from '../components/PageHead'
import Empty from '../components/Empty'
import { Button } from '../components/Button'
import Modal from '../components/Modal'
import { Field, Input } from '../components/Field'
import { useToast } from '../context/ToastContext'
import { listProperties, type Property } from '../lib/api/properties'
import { listMaterials, createMaterial, updateMaterial, deleteMaterial, type Material, type MaterialInput } from '../lib/api/materials'

const emptyForm: MaterialInput = { name: '', quantity: 0, unit: null, location: null, notes: null, property_id: null }

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Material | null | 'new'>(null)
  const toast = useToast()

  const refresh = async () => {
    const [m, p] = await Promise.all([listMaterials(), listProperties()])
    setMaterials(m); setProperties(p); setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  if (loading) return <PageHead title="Materiais" subtitle="A carregar…" />

  return (
    <>
      <PageHead title="Materiais" subtitle={`${materials.length} itens registados`} action={<Button variant="primary" onClick={() => setEditing('new')}>+ Adicionar material</Button>} />

      {materials.length === 0 ? (
        <Empty icon="🧰" title="Nenhum material registado." />
      ) : (
        <div className="card p-1.5 overflow-x-auto">
          <table className="w-full text-[13.5px] border-collapse">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[var(--ink-3)] text-left">
                <th className="p-3.5 font-bold">Nome</th>
                <th className="p-3.5 font-bold">Quantidade</th>
                <th className="p-3.5 font-bold">Unidade</th>
                <th className="p-3.5 font-bold">Localização</th>
                <th className="p-3.5 font-bold">Apartamento</th>
                <th className="p-3.5 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id} className="border-t border-black/5 dark:border-white/5 hover:bg-blue-500/5">
                  <td className="p-3.5 font-semibold">{m.name}</td>
                  <td className="p-3.5">{m.quantity}</td>
                  <td className="p-3.5">{m.unit ?? '—'}</td>
                  <td className="p-3.5">{m.location ?? '—'}</td>
                  <td className="p-3.5">{properties.find(p => p.id === m.property_id)?.name ?? '—'}</td>
                  <td className="p-3.5"><button className="link" onClick={() => setEditing(m)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <MaterialModal
          material={editing === 'new' ? null : editing}
          properties={properties}
          onClose={() => setEditing(null)}
          onSaved={async () => { await refresh(); setEditing(null) }}
          toast={toast}
        />
      )}
    </>
  )
}

function MaterialModal({ material, properties, onClose, onSaved, toast }: {
  material: Material | null; properties: Property[]; onClose: () => void; onSaved: () => void; toast: (m: string) => void
}) {
  const [form, setForm] = useState<MaterialInput>(material ? {
    name: material.name, quantity: material.quantity, unit: material.unit, location: material.location, notes: material.notes, property_id: material.property_id
  } : emptyForm)
  const [saving, setSaving] = useState(false)

  const set = (k: keyof MaterialInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'number' ? (e.target.value === '' ? 0 : +e.target.value) : e.target.value }))

  const save = async () => {
    if (!form.name) { toast('Indica o nome do material'); return }
    setSaving(true)
    try {
      if (material) await updateMaterial(material.id, form)
      else await createMaterial(form)
      toast(material ? 'Material atualizado' : 'Material adicionado')
      onSaved()
    } catch (e) {
      toast('Erro ao guardar: ' + (e as Error).message)
    } finally { setSaving(false) }
  }

  const remove = async () => {
    if (!material) return
    if (!confirm('Eliminar este material?')) return
    await deleteMaterial(material.id)
    toast('Material eliminado')
    onSaved()
  }

  return (
    <Modal
      title={material ? 'Editar material' : 'Novo material'}
      onClose={onClose}
      footer={<>
        {material && <Button variant="danger" onClick={remove}>Eliminar</Button>}
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={saving} onClick={save}>Guardar</Button>
      </>}
    >
      <Field label="Nome"><Input value={form.name} onChange={set('name')} /></Field>
      <Field label="Quantidade"><Input type="number" value={form.quantity} onChange={set('quantity')} /></Field>
      <Field label="Unidade"><Input value={form.unit ?? ''} onChange={set('unit')} /></Field>
      <Field label="Localização"><Input value={form.location ?? ''} onChange={set('location')} /></Field>
      <Field label="Apartamento">
        <select value={form.property_id ?? ''} onChange={e => setForm(f => ({ ...f, property_id: e.target.value || null }))} className="w-full rounded-[13px] border border-black/10 dark:border-white/10 bg-white/75 dark:bg-white/5 px-3.5 py-3 text-sm">
          <option value="">(Global)</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Notas">
        <textarea value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full rounded-[13px] border border-black/10 dark:border-white/10 bg-white/75 dark:bg-white/5 px-3.5 py-3 text-sm min-h-24" />
      </Field>
    </Modal>
  )
}
