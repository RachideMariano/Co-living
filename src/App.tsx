import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties'
import ComingSoon from './pages/ComingSoon'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="apartamentos" element={<Properties />} />
                <Route path="inquilinos" element={<ComingSoon title="Inquilinos" />} />
                <Route path="pagamentos" element={<ComingSoon title="Pagamentos" />} />
                <Route path="alertas" element={<ComingSoon title="Alertas" />} />
                <Route path="manutencao" element={<ComingSoon title="Manutenção" />} />
                <Route path="despesas" element={<ComingSoon title="Despesas" />} />
                <Route path="mensagens" element={<ComingSoon title="Mensagens" />} />
                <Route path="relatorios" element={<ComingSoon title="Relatórios" />} />
                <Route path="interessados" element={<ComingSoon title="Interessados" />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
