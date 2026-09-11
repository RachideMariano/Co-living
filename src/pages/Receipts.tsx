import { useEffect, useState } from 'react'
import { listReceipts, createReceipt } from '../lib/api/receipts'
import { listTenants } from '../lib/api/tenants'

export default function Receipts() {
  const [receipts, setReceipts] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [tenantId, setTenantId] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [r, t] = await Promise.all([listReceipts(), listTenants()])
      setReceipts(r)
      setTenants(t)
      if (t.length && !tenantId) setTenantId(t[0].id)
    } finally { setLoading(false) }
  }

  async function handleCreate() {
    if (!tenantId) return
    setLoading(true)
    try {
      // minimal: read tenant rent and move_in to compute prorrata
      const tenant = tenants.find(t => t.id === tenantId)
      const rent = tenant?.rent ?? 0
      // compute period
      const periodStart = new Date(year, month - 1, 1)
      const periodEnd = new Date(year, month, 0)
      // prorrata by days in month
      let daysBilled = (periodEnd.getDate())
      let prorated = false
      let proratedAmount: number | undefined = undefined
      if (tenant?.move_in) {
        const moveIn = new Date(tenant.move_in)
        if (moveIn > periodStart && moveIn <= periodEnd) {
          const days = (periodEnd.getDate() - moveIn.getDate() + 1)
          daysBilled = days
          prorated = true
          proratedAmount = Math.round(((rent / periodEnd.getDate()) * days) * 100) / 100
        }
      }

      const num = await createReceipt({
        tenant_id: tenantId,
        property_id: tenant.property_id,
        year, month,
        period_start: periodStart.toISOString().slice(0,10),
        period_end: periodEnd.toISOString().slice(0,10),
        days_billed: daysBilled,
        rent,
        prorated,
        prorated_amount: proratedAmount ?? undefined,
        amount_paid: 0
      })
      await fetchAll()
      alert('Recibo criado: ' + num)
    } catch (err: any) {
      alert('Erro: ' + (err.message || String(err)))
    } finally { setLoading(false) }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Recibos</h2>
      <div className="mb-4">
        <label className="block text-sm font-semibold">Inquilino</label>
        <select value={tenantId} onChange={e => setTenantId(e.target.value)} className="mt-2 p-2 border rounded">
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name} — {t.email ?? t.contact}</option>)}
        </select>
      </div>
      <div className="flex gap-2 mb-4">
        <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="p-2 border rounded" />
        <input type="number" value={month} min={1} max={12} onChange={e => setMonth(Number(e.target.value))} className="p-2 border rounded" />
        <button onClick={handleCreate} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">Gerar recibo</button>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Recibos gerados</h3>
        {receipts.length === 0 ? <p className="text-sm text-muted">Nenhum recibo</p> : (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left"><th>Nº</th><th>Inquilino</th><th>Período</th><th>Valor</th><th>Emitido</th></tr>
            </thead>
            <tbody>
              {receipts.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.receipt_number}</td>
                  <td>{r.tenant_id}</td>
                  <td>{r.year}-{String(r.month).padStart(2,'0')}</td>
                  <td>€{r.prorated ? (r.prorated_amount ?? r.rent) : r.rent}</td>
                  <td>{new Date(r.issued_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
