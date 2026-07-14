import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError('Email ou password incorretos.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="scene" />
      <div className="orb o1" /><div className="orb o2" /><div className="orb o3" />
      <form
        onSubmit={onSubmit}
        className="card w-full max-w-sm p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
               style={{ background: 'linear-gradient(145deg,#3b82f6,#8b5cf6)', boxShadow: '0 6px 16px rgba(99,102,241,.4)' }}>
            ⌂
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Co-living OS</h1>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-3)]">Gestão Pro</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5">Email</label>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3.5 py-3 text-sm outline-none focus:border-[var(--color-blue)] focus:ring-4 focus:ring-blue-500/15"
          />
        </div>
        <div className="mb-6">
          <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5">Password</label>
          <input
            type="password" required value={password} onChange={e => setPassword(e.target.value)}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3.5 py-3 text-sm outline-none focus:border-[var(--color-blue)] focus:ring-4 focus:ring-blue-500/15"
          />
        </div>

        {error && <p className="text-[var(--color-red)] text-sm mb-4">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full rounded-2xl text-white font-semibold text-sm py-3 transition-transform active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(160deg,#3d8bfd,#0a6cf5)', boxShadow: '0 8px 20px rgba(10,108,245,.38)' }}
        >
          {loading ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
