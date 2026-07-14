import type { ReactNode } from 'react'

export default function Empty({ icon, title, subtitle, action }: { icon: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-16 px-5 text-[var(--ink-3)]">
      <div className="glass-panel w-[76px] h-[76px] mx-auto mb-4 rounded-[22px] flex items-center justify-center text-[34px]">{icon}</div>
      <p className="text-[15px] font-semibold text-[var(--ink-2)]">{title}</p>
      {subtitle && <p className="text-[13px] mt-1 font-medium text-[var(--ink-3)]">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
