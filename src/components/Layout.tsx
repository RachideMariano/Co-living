import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { computeAlerts } from '../lib/alerts'
import { listProperties } from '../lib/api/properties'
import { listTenants } from '../lib/api/tenants'
import { listOnboarding } from '../lib/api/onboarding'
import { listPayments } from '../lib/api/payments'
import { listMaintenanceTickets } from '../lib/api/maintenance'
import { listMaintenanceSchedules } from '../lib/api/maintenanceSchedules'

export default function Layout() {
  const [alertCount, setAlertCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      listProperties(), listTenants(), listOnboarding(), listPayments(), listMaintenanceTickets(), listMaintenanceSchedules(),
    ]).then(([p, t, ob, pay, tk, sch]) => {
      setAlertCount(computeAlerts(p, t, ob, pay, tk, sch).length)
    })
  }, [])

  return (
    <div className="flex min-h-screen" style={{ perspective: '1600px' }}>
      <div className="scene" />
      <div className="orb o1" /><div className="orb o2" /><div className="orb o3" />
      <Sidebar alertCount={alertCount} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <button
        className="absolute top-4 left-4 z-40 p-2 rounded-md bg-white/80 dark:bg-black/60 md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <span className="text-[20px]">☰</span>
      </button>
      <main className="flex-1 px-9 pt-[34px] pb-[60px] max-w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
