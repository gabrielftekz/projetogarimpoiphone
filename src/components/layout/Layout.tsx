import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden relative">
        <Header />
        <main className="flex-1 p-6 lg:p-10 max-w-[1400px] w-full mx-auto fade">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
