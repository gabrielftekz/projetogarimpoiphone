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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FCF9F5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <img src={logoSvg} alt="TEKZ" style={{ height: 48, width: 'auto', marginBottom: 8 }} />
        </div>

        <div
          className="card fade"
          style={{ borderRadius: 24, padding: 32 }}
        >
          <h2 style={{ marginBottom: 6, color: '#4A443F', fontSize: 18, fontWeight: 700 }}>Bem-vindo de volta</h2>
          <p style={{ color: '#9A948E', fontSize: 13, marginBottom: 28 }}>Entre com suas credenciais para continuar</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="email" style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                style={{
                  border: '1px solid #EDE8E0',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 14,
                  color: '#4A443F',
                  background: '#FAFAF8',
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  width: '100%',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="password" style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    border: '1px solid #EDE8E0',
                    borderRadius: 12,
                    padding: '10px 40px 10px 14px',
                    fontSize: 14,
                    color: '#4A443F',
                    background: '#FAFAF8',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#B5AFA9',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FEF3F2', color: '#B91C1C', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
                borderRadius: 14,
                fontSize: 14,
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: '#C8C2BB', fontSize: 12 }}>
          © 2026 TEKZ
        </p>
      </div>
    </div>
  )
}
