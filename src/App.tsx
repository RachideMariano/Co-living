import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties'
import Tenants from './pages/Tenants'
import Payments from './pages/Payments'
import Alerts from './pages/Alerts'
import Maintenance from './pages/Maintenance'
import Expenses from './pages/Expenses'
import Messages from './pages/Messages'
import Reports from './pages/Reports'
import Leads from './pages/Leads'
import Landlords from './pages/Landlords'
import CalendarPage from './pages/Calendar'
import Receipts from './pages/Receipts'
import Templates from './pages/Templates'
import SOPs from './pages/SOPs'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="apartamentos" element={<Properties />} />
                <Route path="inquilinos" element={<Tenants />} />
                <Route path="pagamentos" element={<Payments />} />
                <Route path="alertas" element={<Alerts />} />
                <Route path="manutencao" element={<Maintenance />} />
                <Route path="despesas" element={<Expenses />} />
                <Route path="mensagens" element={<Messages />} />
                <Route path="relatorios" element={<Reports />} />
                <Route path="interessados" element={<Leads />} />
                <Route path="senhorios" element={<Landlords />} />
                <Route path="recibos" element={<Receipts />} />
                <Route path="templates" element={<Templates />} />
                <Route path="sops" element={<SOPs />} />
                <Route path="sops/:id" element={<SOPs />} />
                <Route path="calendario" element={<CalendarPage />} />
              </Route>
            </Route>
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
