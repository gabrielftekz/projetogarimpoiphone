import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency, daysSince } from '../lib/utils'
import Icon from '../components/ui/Icon'
import type { OrdemServico, Aparelho } from '../types'

const AVATAR_COLORS = [
  { cor: '#BFDBFE', text: '#1D4ED8' },
  { cor: '#FBCFE8', text: '#9D174D' },
  { cor: '#BBF7D0', text: '#166534' },
]

interface VendedorRanking {
  id: string
  nome: string
  totalVendas: number
  numVendas: number
}

interface DashStats {
  totalDisponiveis: number
  osProntas: OrdemServico[]
  alertasBateria: Aparelho[]
  lucroMes: number
  vendasHoje: number
  osEmAberto: number
  vendedores: VendedorRanking[]
}

export default function DashboardPage() {
  const { isAdmin, profile } = useAuth()
  const [stats, setStats] = useState<DashStats>({
    totalDisponiveis: 0,
    osProntas: [],
    alertasBateria: [],
    lucroMes: 0,
    vendasHoje: 0,
    osEmAberto: 0,
    vendedores: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { count: disponiveis },
        { data: osProntas },
        { data: bateria },
      ] = await Promise.all([
        supabase.from('aparelhos').select('id', { count: 'exact', head: true }).eq('status', 'Disponível'),
        supabase.from('ordens_servico').select('*').in('status', ['Pronto', 'pronto']).limit(10),
        supabase.from('aparelhos').select('*').lt('bateria_pct', 82).neq('status', 'Vendido').limit(20),
      ])

      const newStats: DashStats = {
        totalDisponiveis: disponiveis ?? 0,
        osProntas: (osProntas ?? []) as OrdemServico[],
        alertasBateria: (bateria ?? []) as Aparelho[],
        lucroMes: 0,
        vendasHoje: 0,
        osEmAberto: 0,
        vendedores: [],
      }

      if (isAdmin) {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()

        const [
          { data: vendasMes },
          { count: vendHoje },
          { count: osAberto },
          { data: perfisData },
          { data: todasVendas },
        ] = await Promise.all([
          supabase.from('vendas').select('lucro_liquido').gte('created_at', inicio),
          supabase.from('vendas').select('id', { count: 'exact', head: true }).gte('created_at', hoje.toISOString()),
          supabase.from('ordens_servico').select('id', { count: 'exact', head: true }).not('status', 'in', '(Entregue,entregue)'),
          supabase.from('perfis').select('id, nome').eq('role', 'vendedor'),
          supabase.from('vendas').select('vendedor_id, preco_venda'),
        ])

        newStats.lucroMes = (vendasMes ?? []).reduce((s, v) => s + (v.lucro_liquido ?? 0), 0)
        newStats.vendasHoje = vendHoje ?? 0
        newStats.osEmAberto = osAberto ?? 0

        const vendMap: Record<string, VendedorRanking> = {}
        for (const p of (perfisData ?? [])) {
          vendMap[p.id] = { id: p.id, nome: p.nome, totalVendas: 0, numVendas: 0 }
        }
        for (const v of (todasVendas ?? [])) {
          if (v.vendedor_id && vendMap[v.vendedor_id]) {
            vendMap[v.vendedor_id].totalVendas += v.preco_venda ?? 0
            vendMap[v.vendedor_id].numVendas += 1
          }
        }
        newStats.vendedores = Object.values(vendMap).sort((a, b) => b.totalVendas - a.totalVendas).slice(0, 3)
      }

      setStats(newStats)
      setLoading(false)
    }
    load()
  }, [isAdmin])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const firstName = profile?.nome?.split(' ')[0] ?? ''

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <div style={{ width: 32, height: 32, border: '3px solid #EEF3E5', borderTopColor: '#5D6D3E', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div className="fade" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Hero */}
      <div className="card" style={{ padding: '32px 36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: '#2D2926', letterSpacing: '-0.5px' }}>{greeting}{firstName ? `, ${firstName}!` : '!'} ☀️</h1>
            <p style={{ fontSize: 16, color: '#9A948E', marginTop: 6 }}>Aqui está o resumo da saúde da sua loja hoje.</p>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 18, padding: '16px 24px', textAlign: 'center', minWidth: 140 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Lucro do Mês</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#15803D', letterSpacing: '-0.5px' }}>{formatCurrency(stats.lucroMes)}</div>
              </div>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 18, padding: '16px 24px', textAlign: 'center', minWidth: 140 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Vendas Hoje</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1D4ED8', letterSpacing: '-0.5px' }}>{stats.vendasHoje}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { icon: 'check_circle', bg: '#F0FDF4', border: '#BBF7D0', iconColor: '#16A34A', title: 'Tudo em dia', sub: 'Backups realizados' },
            { icon: 'inventory_2', bg: '#FFF7ED', border: '#FED7AA', iconColor: '#EA580C', title: 'Atenção ao estoque', sub: `${stats.alertasBateria.length} itens com bateria baixa` },
            { icon: 'build', bg: '#EFF6FF', border: '#BFDBFE', iconColor: '#2563EB', title: 'Reparos Ativos', sub: `${stats.osEmAberto} celulares na bancada` },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 18, padding: '16px 18px', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, background: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.08)', flexShrink: 0 }}>
                <Icon name={s.icon} size={18} style={{ color: s.iconColor }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2D2926' }}>{s.title}</div>
                <div style={{ fontSize: 11, color: '#9A948E', marginTop: 2 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* O que fazer agora */}
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#4A443F', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="task_alt" size={20} style={{ color: '#5D6D3E' }} /> O que fazer agora?
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { badge: 'Urgente', badgeBg: '#FEF3C7', badgeText: '#92400E', title: 'Pagar Comissões Pendentes', desc: 'Vendedores aguardam o fechamento do mês.', showAvatars: true },
              { badge: 'Reposição', badgeBg: '#DBEAFE', badgeText: '#1E40AF', title: 'Repor Peças de iPhone 13', desc: 'O estoque de telas está crítico (apenas 2 unidades).' },
              { badge: 'Relatório', badgeBg: '#D1FAE5', badgeText: '#065F46', title: 'Verificar Desempenho', desc: 'Sua margem líquida cresceu 12% esta semana!' },
            ].map((item, i) => (
              <div key={i} className="action-card" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ background: item.badgeBg, color: item.badgeText, padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.badge}</span>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#2D2926', margin: '8px 0 4px' }}>{item.title}</h4>
                    <p style={{ fontSize: 13, color: '#9A948E' }}>{item.desc}</p>
                    {item.showAvatars && stats.vendedores.length > 0 && (
                      <div style={{ display: 'flex', marginTop: 12 }}>
                        {stats.vendedores.map((v, j) => {
                          const av = AVATAR_COLORS[j % AVATAR_COLORS.length]
                          return (
                            <div key={j} style={{ width: 28, height: 28, borderRadius: '50%', background: av.cor, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: av.text, marginLeft: j > 0 ? -8 : 0, zIndex: 3 - j }}>
                              {v.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <Icon name="arrow_forward" size={20} style={{ color: '#D4CEC8', flexShrink: 0 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Destaques da equipe */}
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#4A443F', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="stars" size={20} style={{ color: '#F59E0B' }} /> Destaques da Equipe
          </h3>

          <div className="card" style={{ marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px', borderBottom: '1px solid #F5F0EA' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#B5AFA9', textTransform: 'uppercase', letterSpacing: 0.8 }}>Vendedores do Mês</span>
              </div>
              {stats.vendedores.length === 0 ? (
                <p style={{ fontSize: 13, color: '#B5AFA9', textAlign: 'center', padding: '12px 0' }}>Nenhum dado de vendas ainda</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {stats.vendedores.map((v, i) => {
                    return (
                      <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: i === 0 ? '#EFF6FF' : '#F9FAFB', border: `1px solid ${i === 0 ? '#BFDBFE' : '#E5E7EB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: i === 0 ? '#1D4ED8' : '#6B7280' }}>{i + 1}º</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#2D2926' }}>{v.nome}</div>
                            <div style={{ fontSize: 11, color: '#B5AFA9' }}>{v.numVendas} vendas</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#2D2926' }}>{formatCurrency(v.totalVendas)}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? '#16A34A' : '#9CA3AF' }}>faturamento</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 16px', background: '#FAFAF8' }}>
              <button className="btn-ghost" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="emoji_events" size={16} /> Ver Ranking Completo
              </button>
            </div>
          </div>

          {/* Avisos */}
          <div style={{ background: '#FDF6F0', border: '1px solid #F5E6DA', borderRadius: 18, padding: '16px 20px' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#8C6D51', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Icon name="info" size={16} /> Avisos Importantes
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', marginTop: 4, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#8C6D51' }}>Sincronização com filial Centro falhou às 10:42. <span style={{ fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>Tentar novamente</span></p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', marginTop: 4, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#8C6D51' }}>Backup concluído com sucesso às 09:15.</p>
              </div>
              {stats.osProntas.length > 0 && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', marginTop: 4, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: '#8C6D51' }}>{stats.osProntas.length} OS prontas aguardam aviso ao cliente.</p>
                </div>
              )}
              {daysSince && stats.alertasBateria.filter(a => daysSince(a.data_entrada) > 15).length > 0 && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', marginTop: 4, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: '#8C6D51' }}>Aparelhos parados há +15 dias no estoque.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
