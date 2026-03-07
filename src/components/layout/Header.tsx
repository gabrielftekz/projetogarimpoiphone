import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getInitials } from '../../lib/utils'
import Icon from '../ui/Icon'
import logoSvg from '../../assets/logo.svg'

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: 'home' },
  { to: '/assistente', label: 'Assistente IA', icon: 'smart_toy' },
  { to: '/estoque', label: 'Estoque', icon: 'inventory_2' },
  { to: '/oficina', label: 'Oficina', icon: 'build' },
  { to: '/calculadora', label: 'Calculadora', icon: 'calculate' },
]

export default function Header() {
  const { profile, isAdmin, signOut } = useAuth()
  const location = useLocation()

  const navItems = isAdmin
    ? [...NAV_ITEMS, { to: '/analytics', label: 'Admin', icon: 'bar_chart' }]
    : NAV_ITEMS

  const initials = profile ? getInitials(profile.nome) : '?'
  const firstName = profile?.nome?.split(' ')[0] ?? 'Usuário'

  return (
    <header style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid #F0EBE3', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logoSvg} alt="TEKZ" style={{ height: 36, width: 'auto' }} />
          </div>

          <nav style={{ display: 'flex', gap: 4 }}>
            {navItems.map(n => {
              const isActive = location.pathname === n.to
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className="nav-link"
                  style={{
                    gap: 6,
                    padding: '7px 14px',
                    color: isActive ? '#5D6D3E' : '#9A948E',
                    fontWeight: isActive ? 700 : 600,
                    fontSize: 14,
                    borderBottom: isActive ? '2px solid #5D6D3E' : '2px solid transparent',
                    borderRadius: 0,
                  }}
                >
                  <Icon name={n.icon} size={16} />
                  {n.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ width: 38, height: 38, borderRadius: 10, background: 'none', border: '1px solid #EDE8E0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9A948E' }}>
            <Icon name="notifications" size={18} />
          </button>
          <div style={{ width: 1, height: 28, background: '#EDE8E0', margin: '0 8px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#4A443F', lineHeight: 1.2 }}>{firstName}</div>
              <div style={{ fontSize: 11, color: '#B5AFA9' }}>{isAdmin ? 'Administrador' : 'Vendedor'}</div>
            </div>
            <button
              onClick={signOut}
              title="Sair"
              style={{ width: 38, height: 38, borderRadius: '50%', background: '#FFDAB9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#7A5C3A' }}
            >
              {initials}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
