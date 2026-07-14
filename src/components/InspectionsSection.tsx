import { useEffect, useRef, useState } from 'react'
import { Button } from './Button'
import { Select } from './Field'
import { useToast } from '../context/ToastContext'
import { fmtDate, todayISO } from '../lib/format'
import {
  addInspectionPhoto, createInspection, deleteInspection, listInspectionsForTenant, removeInspectionPhoto,
  type Inspection,
} from '../lib/api/inspections'
import { getSignedUrl } from '../lib/api/storage'
import type { InspectionType } from '../lib/database.types'

const typeLabel: Record<InspectionType, string> = { move_in: 'Entrada', move_out: 'Saída' }

export default function InspectionsSection({ tenantId }: { tenantId: string }) {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [creating, setCreating] = useState(false)
  const [newType, setNewType] = useState<InspectionType>('move_in')
  const toast = useToast()

  const refresh = async () => setInspections(await listInspectionsForTenant(tenantId))
  useEffect(() => { refresh() }, [tenantId])

  const create = async () => {
    setCreating(true)
    try {
      await createInspection(tenantId, newType, todayISO(), '')
      refresh()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mb-4">
      <div className="text-xs font-bold uppercase tracking-wide text-[var(--ink-3)] mb-2">Vistorias (entrada/saída)</div>
      {inspections.length === 0 && <p className="text-[13px] text-[var(--ink-3)] font-medium mb-2.5">Nenhuma vistoria registada.</p>}
      {inspections.map(insp => (
        <InspectionRow key={insp.id} inspection={insp} onChanged={refresh} toast={toast} />
      ))}
      <div className="flex gap-2 mt-2.5">
        <Select value={newType} onChange={e => setNewType(e.target.value as InspectionType)} className="w-auto">
          <option value="move_in">Vistoria de entrada</option>
          <option value="move_out">Vistoria de saída</option>
        </Select>
        <Button disabled={creating} onClick={create}>+ Nova vistoria</Button>
      </div>
    </div>
  )
}

function InspectionRow({ inspection, onChanged, toast }: { inspection: Inspection; onChanged: () => void; toast: (m: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await addInspectionPhoto(inspection, file)
      onChanged()
    } catch (err) {
      toast('Erro ao carregar foto: ' + (err as Error).message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const viewPhoto = async (path: string) => {
    const url = await getSignedUrl(path)
    window.open(url, '_blank')
  }

  const removePhoto = async (path: string) => {
    await removeInspectionPhoto(inspection, path)
    onChanged()
  }

  const remove = async () => {
    if (!confirm('Eliminar esta vistoria e as respetivas fotos?')) return
    await deleteInspection(inspection)
    onChanged()
  }

  return (
    <div className="px-3.5 py-3 bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-[13px] mb-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold">{typeLabel[inspection.type]} · {fmtDate(inspection.date)}</span>
        <button className="text-[var(--color-red)] text-xs font-semibold" onClick={remove}>Eliminar</button>
      </div>
      {inspection.photos.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2">
          {inspection.photos.map(p => (
            <div key={p} className="flex items-center gap-1 bg-black/5 dark:bg-white/10 rounded-full pl-2.5 pr-1 py-1">
              <button className="link text-xs" onClick={() => viewPhoto(p)}>foto</button>
              <button className="text-[var(--color-red)] text-xs w-4 h-4" onClick={() => removePhoto(p)}>✕</button>
            </div>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} disabled={uploading} className="text-xs mt-2" />
    </div>
  )
}
