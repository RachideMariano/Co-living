export const eur = (n: number | null | undefined) =>
  '€' + (Math.round(n ?? 0)).toLocaleString('pt-PT')

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)

export const todayISO = () => new Date().toISOString().slice(0, 10)

export const monthKey = (d: Date) => d.toISOString().slice(0, 7)
