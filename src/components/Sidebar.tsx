import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const items = [
  { to: '/', label: 'Dashboard', ico: '◫', cls: 'i-dash', end: true },
  { to: '/apartamentos', label: 'Apartamentos', ico: '⌂', cls: 'i-home' },
  { to: '/apartamentos/por-adquirir', label: 'Por adquirir', ico: '🏚️', cls: 'i-home' },
  { to: '/inquilinos', label: 'Inquilinos', ico: '☺', cls: 'i-user' },
  { to: '/pagamentos', label: 'Pagamentos', ico: '€', cls: 'i-pay' },
  { to: '/alertas', label: 'Alertas', ico: '!', cls: 'i-bell' },
  { to: '/manutencao', label: 'Manutenção', ico: '🔧', cls: 'i-bell' },
  { to: '/despesas', label: 'Despesas', ico: '📄', cls: 'i-pay' },
  { to: '/materiais', label: 'Materiais', ico: '🧰', cls: 'i-home' },
  { to: '/mensagens', label: 'Mensagens', ico: '✉', cls: 'i-msg' },
  { to: '/relatorios', label: 'Relatórios', ico: '📊', cls: 'i-dash' },
  { to: '/recibos', label: 'Recibos', ico: '🧾', cls: 'i-dash' },
  { to: '/sops', label: 'Procedimentos', ico: '📝', cls: 'i-dash' },
  { to: '/templates', label: 'Templates', ico: '📁', cls: 'i-dash' },
  { to: '/interessados', label: 'Interessados', ico: '★', cls: 'i-user' },
  { to: '/senhorios', label: 'Senhorios', ico: '🧑', cls: 'i-home' },
  { to: '/calendario', label: 'Calendário', ico: '📅', cls: 'i-pay' },
]

const icoBg: Record<string, string> = {
  'i-dash': 'linear-gradient(145deg,#5ac8fa,#0a84ff)',
  'i-home': 'linear-gradient(145deg,#ffb340,#ff9f0a)',
  'i-user': 'linear-gradient(145deg,#66dd7a,#30b14e)',
  'i-pay': 'linear-gradient(145deg,#8f79f2,#bf5af2)',
  'i-bell': 'linear-gradient(145deg,#ff6961,#ff453a)',
  'i-msg': 'linear-gradient(145deg,#6ad7ff,#37b8f2)',
  'i-landlord': '#000',
}

export default function Sidebar({ alertCount = 0, mobileOpen = false, onClose, uiMode = 'auto', setUiMode, isMobileMode = false }: { alertCount?: number; mobileOpen?: boolean; onClose?: () => void; uiMode?: 'auto' | 'desktop' | 'mobile'; setUiMode?: (m: 'auto' | 'desktop' | 'mobile') => void; isMobileMode?: boolean }) {
  const mobileClasses = mobileOpen
    ? 'fixed inset-0 left-0 top-0 bottom-0 w-[86%] max-w-[380px] z-50 m-4 rounded-[18px]'
    : isMobileMode
    ? 'hidden'
    : ''

  const handleModeChange = (v: string) => {
    if (!setUiMode) return
    const m = (v as 'auto' | 'desktop' | 'mobile')
    setUiMode(m)
  }

  return (
    <aside className={`glass-panel ${mobileClasses} w-full md:w-[250px] shrink-0 m-[12px_0_12px_12px] md:m-[18px_0_18px_18px] md:sticky md:top-[18px] md:h-[calc(100vh-36px)] rounded-[18px] md:rounded-[26px] flex flex-col overflow-hidden`}>
      <div className="px-[14px] md:px-[22px] pt-[14px] md:pt-[26px] pb-[12px] md:pb-[18px]">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white font-bold text-lg"
            style={{ background: 'linear-gradient(145deg,#3b82f6,#8b5cf6)', boxShadow: '0 6px 16px rgba(99,102,241,.4)' }}
          >
            ⌂
          </div>
          <div>
            <h1 className="text-[16.5px] font-bold tracking-tight">Co-living OS</h1>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-3)]">Gestão Pro</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="ml-auto md:hidden p-1.5 rounded-md bg-white/10" aria-label="Close menu">
              <span className="text-[18px]">✕</span>
            </button>
          )}
        </div>
      </div>

      <nav className="px-3 flex-1 overflow-y-auto">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 mb-1 rounded-[14px] text-[14px] font-medium transition-colors ${
                isActive ? 'bg-white/70 dark:bg-white/10 text-[var(--ink)] shadow-sm' : 'text-[var(--ink-2)] hover:bg-white/40 dark:hover:bg-white/5'
              }`
            }
          >
            <span
              className="w-7 h-7 rounded-[9px] flex items-center justify-center text-[13px] text-white shrink-0"
              style={{ background: icoBg[item.cls] }}
            >
              {item.ico}
            </span>
            <span>{item.label}</span>
            {item.to === '/alertas' && alertCount > 0 && (
              <span className="ml-auto bg-[var(--color-red)] text-white text-[10.5px] font-bold min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center">
                {alertCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-[22px] py-4 text-[11px] text-[var(--ink-3)] font-medium border-t border-black/5 dark:border-white/5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span>Dados sincronizados na cloud</span>
          <div className="text-[11px] text-[var(--ink-3)]">Modo</div>
        </div>
        <div className="flex items-center gap-2">
          <select value={uiMode} onChange={e => handleModeChange(e.target.value)} className="px-2 py-1 rounded bg-white/50">
            <option value="auto">Auto</option>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </select>
          <div className="ml-auto">
            <button
              onClick={() => supabase.auth.signOut()}
              className="link text-left text-[var(--color-blue)] font-semibold"
            >
              Terminar sessão
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
