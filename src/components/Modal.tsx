import type { ReactNode } from 'react'

export default function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-[rgba(30,35,50,.32)] backdrop-blur-md flex items-start justify-center z-[100] overflow-y-auto py-12 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white/90 dark:bg-[#221f2c]/90 backdrop-blur-2xl border border-white/70 dark:border-white/10 rounded-[28px] w-full max-w-[540px] max-h-[88vh] overflow-y-auto shadow-2xl">
        <div className="px-6 pt-5 pb-4 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-[#221f2c]/85 backdrop-blur-xl rounded-t-[28px] z-10">
          <h3 className="text-[19px] font-bold tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-full bg-black/10 dark:bg-white/10 text-[var(--ink-2)] flex items-center justify-center hover:bg-black/20 dark:hover:bg-white/20"
          >
            ✕
          </button>
        </div>
        <div className="px-6 pb-5 pt-2">{children}</div>
        {footer && (
          <div className="px-6 pb-5 pt-4 flex justify-end gap-2.5 flex-wrap sticky bottom-0 bg-white/85 dark:bg-[#221f2c]/85 backdrop-blur-xl rounded-b-[28px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
