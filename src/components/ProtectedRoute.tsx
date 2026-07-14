import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--ink-3)]">A carregar…</div>
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}
