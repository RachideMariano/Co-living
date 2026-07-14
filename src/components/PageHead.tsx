import type { ReactNode } from 'react'

export default function PageHead({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex justify-between items-end mb-6 flex-wrap gap-3.5">
      <div>
        <h2 className="text-[32px] font-extrabold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-[var(--ink-2)] font-medium mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
