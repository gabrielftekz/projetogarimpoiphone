import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Icon from '../ui/Icon'
import logoSvg from '../../assets/logo.svg'

const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', icon: 'space_dashboard' },
    { to: '/assistente', label: 'AI Bot', icon: 'smart_toy' },
    { to: '/estoque', label: 'Estoque', icon: 'inventory_2' },
    { to: '/oficina', label: 'Oficina', icon: 'build' },
    { to: '/calculadora', label: 'Métricas', icon: 'calculate' },
]

export default function Sidebar() {
    const { isAdmin } = useAuth()
    const location = useLocation()

    const navItems = isAdmin
        ? [...NAV_ITEMS, { to: '/analytics', label: 'Admin', icon: 'monitoring' }]
        : NAV_ITEMS

    return (
        <aside className="w-[80px] lg:w-[240px] flex-shrink-0 h-screen sticky top-0 border-r border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col transition-all duration-300">
            <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
                <img src={logoSvg} alt="TEKZ" className="h-8 w-auto filter drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                <span className="hidden lg:block ml-3 font-bold text-lg text-white tracking-widest">TEKZ</span>
            </div>

            <nav className="flex-1 py-8 px-3 lg:px-4 flex flex-col gap-2">
                {navItems.map(n => {
                    const isActive = location.pathname === n.to
                    return (
                        <Link
                            key={n.to}
                            to={n.to}
                            className={`flex items-center gap-4 rounded-xl transition-all duration-300 group
                ${isActive
                                    ? 'bg-white text-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
                ${isActive ? 'py-3 px-4' : 'py-3 px-4'}
              `}
                        >
                            <div className={`${isActive ? 'text-zinc-900' : 'group-hover:text-teal-400 transition-colors'}`}>
                                <Icon name={n.icon} size={22} />
                            </div>
                            <span className={`hidden lg:block font-semibold text-[13px] tracking-wide ${isActive ? 'text-zinc-900' : ''}`}>
                                {n.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/5 hidden lg:block">
                <div className="glass-panel p-4 flex items-center justify-between rounded-2xl bg-gradient-to-br from-teal-500/10 to-purple-500/10 border-white/10">
                    <div className="flex flex-col">
                        <span className="text-xs text-zinc-400 font-medium tracking-wider">SYSTEM STATUS</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="pulse-dot w-2 h-2"></span>
                            <span className="text-sm text-teal-400 font-bold">Online</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
