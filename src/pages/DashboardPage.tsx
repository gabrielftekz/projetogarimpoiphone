import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import Icon from '../components/ui/Icon'
import type { OrdemServico, Aparelho } from '../types'

const AVATAR_COLORS = [
  { cor: 'rgba(56, 189, 248, 0.2)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.5)' },
  { cor: 'rgba(168, 85, 247, 0.2)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.5)' },
  { cor: 'rgba(52, 211, 153, 0.2)', text: '#34d399', border: 'rgba(52, 211, 153, 0.5)' },
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
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-white/10 border-t-teal-400 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="fade flex flex-col gap-6">

      {/* Hero Section */}
      <div className="glass-panel p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-teal-500/10 to-purple-500/10 rounded-full blur-[100px] -z-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              {greeting}{firstName ? `, ${firstName}` : ''}
              <span className="text-teal-400">✨</span>
            </h1>
            <p className="text-zinc-400 mt-2 text-lg">Platform status is optimal. Here is your overview.</p>
          </div>
          {isAdmin && (
            <div className="flex gap-4 w-full md:w-auto">
              <div className="flex-1 md:flex-none glass-panel px-6 py-4 border-teal-500/30 bg-teal-500/5 relative overflow-hidden">
                <div className="absolute -left-2 -top-2 w-12 h-12 bg-teal-500/20 blur-xl rounded-full" />
                <div className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.15em] mb-1 relative z-10">Lucro do Mês</div>
                <div className="text-2xl font-black text-white tracking-tight relative z-10">{formatCurrency(stats.lucroMes)}</div>
              </div>
              <div className="flex-1 md:flex-none glass-panel px-6 py-4 border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden">
                <div className="absolute -left-2 -top-2 w-12 h-12 bg-indigo-500/20 blur-xl rounded-full" />
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-1 relative z-10">Vendas Hoje</div>
                <div className="text-2xl font-black text-white tracking-tight relative z-10">{stats.vendasHoje}</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: 'check_circle', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', color: '#10b981', title: 'Tudo em dia', sub: 'Backups realizados' },
            { icon: 'inventory_2', border: 'border-amber-500/20', bg: 'bg-amber-500/5', color: '#f59e0b', title: 'Atenção ao estoque', sub: `${stats.alertasBateria.length} itens com bateria baixa` },
            { icon: 'build', border: 'border-blue-500/20', bg: 'bg-blue-500/5', color: '#3b82f6', title: 'Reparos Ativos', sub: `${stats.osEmAberto} celulares na bancada` },
          ].map((s, i) => (
            <div key={i} className={`flex items-center gap-4 rounded-2xl border ${s.border} ${s.bg} p-5 transition-all hover:bg-white/5`}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in srgb, ${s.color} 15%, transparent)`, color: s.color, boxShadow: `0 0 15px color-mix(in srgb, ${s.color} 20%, transparent)` }}
              >
                <Icon name={s.icon} size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-100">{s.title}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Action Center */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
            <Icon name="bolt" size={20} className="text-amber-400" /> Action Center
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { badge: 'Urgente', badgeCol: '#fb923c', title: 'Pagar Comissões Pendentes', desc: 'Vendedores aguardam o fechamento do mês.', showAvatars: true },
              { badge: 'Reposição', badgeCol: '#3b82f6', title: 'Repor Peças de iPhone 13', desc: 'O estoque de telas está crítico (apenas 2 unidades).' },
              { badge: 'Relatório', badgeCol: '#10b981', title: 'Verificar Desempenho', desc: 'Sua margem líquida cresceu 12% esta semana!' },
            ].map((item, i) => (
              <div key={i} className="action-card group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" style={{ background: item.badgeCol }} />

                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span
                      className="px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border"
                      style={{ color: item.badgeCol, borderColor: `color-mix(in srgb, ${item.badgeCol} 30%, transparent)`, background: `color-mix(in srgb, ${item.badgeCol} 10%, transparent)` }}
                    >
                      {item.badge}
                    </span>
                    <h4 className="text-base font-bold text-white mt-3 mb-1">{item.title}</h4>
                    <p className="text-sm text-zinc-400">{item.desc}</p>

                    {item.showAvatars && stats.vendedores.length > 0 && (
                      <div className="flex mt-4 items-center">
                        {stats.vendedores.map((v, j) => {
                          const av = AVATAR_COLORS[j % AVATAR_COLORS.length]
                          return (
                            <div
                              key={j}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#121214] -ml-2 first:ml-0"
                              style={{ background: av.cor, color: av.text, borderColor: '#0a0a0a' }}
                            >
                              {v.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-white group-hover:bg-white/10 transition-colors">
                    <Icon name="arrow_forward" size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence / Analytics Column */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
            <Icon name="insights" size={20} className="text-purple-400" /> Intelligence
          </h3>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Top Performers</span>
              </div>

              {stats.vendedores.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">Aguardando dados...</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {stats.vendedores.map((v, i) => (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border
                            ${i === 0 ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{v.nome}</div>
                          <div className="text-xs text-zinc-400 mt-0.5">{v.numVendas} deals closed</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-white tracking-wide">{formatCurrency(v.totalVendas)}</div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${i === 0 ? 'text-teal-400' : 'text-zinc-500'}`}>
                          Revenue
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="w-full p-3 flex items-center justify-center gap-2 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
              <Icon name="open_in_new" size={16} /> View Full Analytics
            </button>
          </div>

          {/* System Notifications */}
          <div className="glass-panel p-5 relative overflow-hidden border-orange-500/10 bg-orange-500/5 mt-2">
            <h4 className="text-sm font-bold text-orange-400 flex items-center gap-2 mb-4">
              <Icon name="notifications_active" size={18} /> System Alerts
            </h4>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <p className="text-sm text-zinc-300">Sincronização com filial Centro falhou às 10:42. <button className="text-red-400 font-bold hover:underline">Retry</button></p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                <p className="text-sm text-zinc-400">Database backup automated task completed (09:15).</p>
              </div>
              {stats.osProntas.length > 0 && (
                <div className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  <p className="text-sm text-zinc-300">{stats.osProntas.length} OS in terminal state awaiting client notification.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
