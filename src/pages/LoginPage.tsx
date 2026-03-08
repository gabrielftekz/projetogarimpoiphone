import { useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import logoSvg from '../assets/logo.svg'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    if (err) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
    }
  }

  const inputClassName = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all font-sans placeholder-zinc-500"

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10 fade">

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)] mb-4">
            <img src={logoSvg} alt="TEKZ" className="h-8 w-auto opacity-90" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">TEKZ Platform</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium tracking-wide">Workspace Management</p>
        </div>

        <div className="glass-panel p-8 sm:p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-[50px] pointer-events-none transition-opacity duration-1000 opacity-50 group-hover:opacity-100" />

          <h2 className="text-xl font-bold text-white mb-2">Bem-vindo de volta</h2>
          <p className="text-zinc-400 text-sm mb-8">Entre com suas credenciais para acessar o painel de controle.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`${inputClassName} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full py-3.5 mt-2 rounded-xl text-sm font-black uppercase tracking-widest relative overflow-hidden group ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <span className="relative z-10">{loading ? 'Autenticando...' : 'Acessar Plataforma'}</span>
              {!loading && (
                <div className="absolute inset-0 bg-white/20 w-1/2 skew-x-[-20deg] group-hover:animate-[shimmer_1.5s_infinite]"></div>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-zinc-600 text-[11px] font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} TEKZ Intelligence Systems
        </p>
      </div>
    </div>
  )
}
