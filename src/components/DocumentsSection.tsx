import { useEffect, useRef, useState } from 'react'
import { Select } from './Field'
import { useToast } from '../context/ToastContext'
import {
  DOC_CATEGORIES, DOC_CATEGORY_LABEL, deleteDocument, listDocumentsForProperty, listDocumentsForTenant, uploadDocument,
  type Document,
} from '../lib/api/documents'
import { getSignedUrl } from '../lib/api/storage'

export default function DocumentsSection({ tenantId, propertyId }: { tenantId?: string; propertyId?: string }) {
  const [docs, setDocs] = useState<Document[]>([])
  const [category, setCategory] = useState<string>(DOC_CATEGORIES[0])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const refresh = async () => {
    const list = tenantId ? await listDocumentsForTenant(tenantId) : await listDocumentsForProperty(propertyId!)
    setDocs(list)
  }
  const [imageUrls, setImageUrls] = useState<Record<string,string>>({})

  useEffect(() => {
    async function fetchImages() {
      const imgs = {} as Record<string,string>
      await Promise.all(docs.map(async d => {
        const ext = d.file_name.split('.').pop()?.toLowerCase() || ''
        if (['png','jpg','jpeg','webp','gif'].includes(ext)) {
          try {
            imgs[d.id] = await getSignedUrl(d.file_path)
          } catch (e) { /* ignore */ }
        }
      }))
      setImageUrls(imgs)
    }
    fetchImages()
  }, [docs])
  useEffect(() => { refresh() }, [tenantId, propertyId])

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadDocument({ tenantId, propertyId, category, file })
      toast('Documento carregado ✓')
      refresh()
    } catch (err) {
      toast('Erro ao carregar: ' + (err as Error).message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const open = async (doc: Document) => {
    const url = await getSignedUrl(doc.file_path)
    window.open(url, '_blank')
  }

  const remove = async (doc: Document) => {
    if (!confirm(`Eliminar "${doc.file_name}"?`)) return
    await deleteDocument(doc)
    refresh()
  }

  return (
    <div className="mb-4">
      <div className="text-xs font-bold uppercase tracking-wide text-[var(--ink-3)] mb-2">Documentos</div>
      {docs.length === 0 && <p className="text-[13px] text-[var(--ink-3)] font-medium mb-2.5">Nenhum documento anexado.</p>}
      {docs.map(d => (
        <div key={d.id} className="flex justify-between items-center px-3.5 py-2.5 bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-[13px] mb-2">
          <div className="flex items-center gap-3">
            {imageUrls[d.id] ? <img src={imageUrls[d.id]} alt={d.file_name} className="w-12 h-12 object-cover rounded-md" onClick={() => open(d)} /> : <div className="w-12 h-12 rounded-md bg-white/10 flex items-center justify-center">📎</div>}
            <button className="link text-left text-sm" onClick={() => open(d)}>
              {d.file_name} <span className="text-[var(--ink-3)] text-xs">· {DOC_CATEGORY_LABEL[d.category] ?? d.category}</span>
            </button>
          </div>
          <button className="text-[var(--color-red)] text-xs font-semibold" onClick={() => remove(d)}>Remover</button>
        </div>
      ))}
      <div className="flex gap-2 mt-2.5">
        <Select value={category} onChange={e => setCategory(e.target.value)} className="w-auto">
          {DOC_CATEGORIES.map(c => <option key={c} value={c}>{DOC_CATEGORY_LABEL[c]}</option>)}
        </Select>
        <input ref={fileRef} type="file" onChange={onFileChange} disabled={uploading} className="text-xs flex-1" />
      </div>
    </div>
  )
}
