import { useEffect, useState } from 'react'
import PageHead from '../components/PageHead'
import { listTemplates } from '../lib/api/documents'
import { getSignedUrl } from '../lib/api/storage'
import { uploadDocument } from '../lib/api/documents'
import { useToast } from '../context/ToastContext'

export default function Templates() {
  const [templates, setTemplates] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const toast = useToast()

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    const list = await listTemplates()
    setTemplates(list)
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    try {
      await uploadDocument({ category: 'template', file: f })
      toast('Template carregado')
      fetchTemplates()
    } catch (err:any) { toast('Erro: ' + err.message) }
    finally { setUploading(false); if (e.target) e.target.value = '' }
  }

  const open = async (t: any) => {
    const url = await getSignedUrl(t.file_path)
    window.open(url, '_blank')
  }

  return (
    <div className="p-6">
      <PageHead title="Templates" subtitle="Modelos de contratos e documentos" />
      <div className="mb-4">
        <input type="file" onChange={onFile} disabled={uploading} />
      </div>
      <div>
        {templates.length === 0 ? <p className="text-sm text-muted">Nenhum template</p> : (
          <ul>
            {templates.map(t => (
              <li key={t.id} className="mb-2">
                <button className="link" onClick={() => open(t)}>{t.file_name}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
