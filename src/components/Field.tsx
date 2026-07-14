import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

const inputCls = 'w-full rounded-[13px] border border-black/10 dark:border-white/10 bg-white/75 dark:bg-white/5 px-3.5 py-3 text-[14.5px] outline-none focus:border-[var(--color-blue)] focus:ring-4 focus:ring-blue-500/15 focus:bg-white dark:focus:bg-white/10'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={className ? `${inputCls} ${className}` : inputCls} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={className ? `${inputCls} ${className}` : inputCls} />
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3.5">{children}</div>
}
