import { useAuth } from '../../contexts/AuthContext'
import { getInitials } from '../../lib/utils'
import Icon from '../ui/Icon'

export default function Header() {
  const { profile, isAdmin, signOut } = useAuth()
  const initials = profile ? getInitials(profile.nome) : '?'
  const firstName = profile?.nome?.split(' ')[0] ?? 'Usuário'

  return (
    <header className="sticky top-0 z-50 h-20 px-8 flex items-center justify-end bg-white/[0.01] backdrop-blur-xl border-b border-white/5 transition-all">
      <div className="flex items-center gap-6">
        <button className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
          <Icon name="notifications" size={20} />
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.8)] animate-pulse-dot"></span>
        </button>

        <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

        <div className="flex items-center gap-4 group cursor-pointer" onClick={signOut}>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-white tracking-wide">{firstName}</div>
            <div className="text-[11px] text-teal-400/80 uppercase tracking-widest font-semibold">
              {isAdmin ? 'Administrador' : 'Vendedor'}
            </div>
          </div>
          <button
            title="Sair"
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-teal-500 to-indigo-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)] group-hover:shadow-[0_0_25px_rgba(20,184,166,0.6)] transition-all"
          >
            {initials}
          </button>
        </div>
      </div>
    </header>
  )
}
