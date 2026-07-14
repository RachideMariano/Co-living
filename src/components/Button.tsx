import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

const base = 'inline-flex items-center gap-1.5 text-[13.5px] font-semibold rounded-[14px] px-5 py-2.5 transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none'
const variants: Record<Variant, string> = {
  primary: 'text-white',
  ghost: 'bg-white/60 dark:bg-white/10 text-[var(--ink)] border border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/15',
  danger: 'bg-[rgba(255,69,58,.1)] text-[var(--color-red)] hover:bg-[rgba(255,69,58,.18)]',
}

export function Button({ variant = 'ghost', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`${base} ${variants[variant]} ${className}`}
      style={variant === 'primary' ? { background: 'linear-gradient(160deg,#3d8bfd,#0a6cf5)', boxShadow: '0 8px 20px rgba(10,108,245,.38)', ...props.style } : props.style}
    />
  )
}
