import { useState } from 'react'
import PageHead from '../components/PageHead'
import { Button } from '../components/Button'
import { Field, FieldRow, Input } from '../components/Field'
import { eur } from '../lib/format'

export default function Acquisitions() {
  const [purchasePrice, setPurchasePrice] = useState<number>(0)
  const [renovationCost, setRenovationCost] = useState<number>(0)
  const [otherCosts, setOtherCosts] = useState<number>(0)
  const [numRooms, setNumRooms] = useState<number>(3)
  const [rentPerRoom, setRentPerRoom] = useState<number>(300)
  const [utilities, setUtilities] = useState<number>(200)
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(100)
  const [vacancyPct, setVacancyPct] = useState<number>(5)

  const totalInvested = purchasePrice + renovationCost + otherCosts
  const monthlyGross = numRooms * rentPerRoom
  const monthlyNet = Math.max(0, monthlyGross - utilities - monthlyExpenses)
  const annualNet = monthlyNet * 12 * (1 - vacancyPct / 100)
  const capRate = totalInvested > 0 ? (annualNet / totalInvested) * 100 : 0
  const paybackYears = annualNet > 0 ? totalInvested / annualNet : Infinity

  return (
    <>
      <PageHead title="Apartamentos · Por adquirir" subtitle="Simulador de custos e rendimento" action={<Button onClick={() => { setPurchasePrice(0); setRenovationCost(0); setOtherCosts(0); setNumRooms(3); setRentPerRoom(300); setUtilities(200); setMonthlyExpenses(100); setVacancyPct(5); }}>Reset</Button>} />

      <div className="card p-[22px]">
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
          <Field label="Preço de compra (€)"><Input type="number" value={purchasePrice} onChange={e => setPurchasePrice(+e.target.value || 0)} /></Field>
          <Field label="Obras / Renovação (€)"><Input type="number" value={renovationCost} onChange={e => setRenovationCost(+e.target.value || 0)} /></Field>
          <Field label="Outros custos iniciais (€)"><Input type="number" value={otherCosts} onChange={e => setOtherCosts(+e.target.value || 0)} /></Field>
          <Field label="Número de quartos"><Input type="number" value={numRooms} onChange={e => setNumRooms(Math.max(1, +e.target.value || 1))} /></Field>
          <Field label="Renda esperada por quarto (€ / mês)"><Input type="number" value={rentPerRoom} onChange={e => setRentPerRoom(+e.target.value || 0)} /></Field>
          <Field label="Utilities estimadas (€ / mês)"><Input type="number" value={utilities} onChange={e => setUtilities(+e.target.value || 0)} /></Field>
          <Field label="Despesas mensais (condomínio, gestão) (€)"><Input type="number" value={monthlyExpenses} onChange={e => setMonthlyExpenses(+e.target.value || 0)} /></Field>
          <Field label="Taxa de vacância (%)"><Input type="number" value={vacancyPct} onChange={e => setVacancyPct(Math.max(0, Math.min(100, +e.target.value || 0)))} /></Field>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-6">
          <Stat label="Total investido" value={eur(totalInvested)} />
          <Stat label="Renda bruta / mês" value={eur(monthlyGross)} />
          <Stat label="Renda líquida / mês" value={eur(monthlyNet)} />
          <Stat label="Renda líquida / ano" value={eur(Math.round(annualNet))} />
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat label="Cap rate" value={capRate ? capRate.toFixed(2) + '%' : '—'} />
          <Stat label="Payback (anos)" value={isFinite(paybackYears) ? paybackYears.toFixed(1) : '—'} />
          <div />
        </div>
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-wide font-bold text-[var(--ink-3)]">{label}</div>
      <div className="text-[18px] font-extrabold mt-1">{value}</div>
    </div>
  )
}
