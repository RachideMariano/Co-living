import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen" style={{ perspective: '1600px' }}>
      <div className="scene" />
      <div className="orb o1" /><div className="orb o2" /><div className="orb o3" />
      <Sidebar />
      <main className="flex-1 px-9 pt-[34px] pb-[60px] max-w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
