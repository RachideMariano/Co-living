import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { computeAlerts } from '../lib/alerts'
import { listProperties } from '../lib/api/properties'
import { listTenants } from '../lib/api/tenants'
import { listOnboarding } from '../lib/api/onboarding'
import { listPayments } from '../lib/api/payments'
import { listMaintenanceTickets } from '../lib/api/maintenance'

export default function Layout() {
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    Promise.all([
      listProperties(), listTenants(), listOnboarding(), listPayments(), listMaintenanceTickets(),
    ]).then(([p, t, ob, pay, tk]) => {
      setAlertCount(computeAlerts(p, t, ob, pay, tk).length)
    })
  }, [])

  return (
    <div className="flex min-h-screen" style={{ perspective: '1600px' }}>
      <div className="scene" />
      <div className="orb o1" /><div className="orb o2" /><div className="orb o3" />
      <Sidebar alertCount={alertCount} />
      <main className="flex-1 px-9 pt-[34px] pb-[60px] max-w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
