import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate, daysSince } from '../lib/utils'
import Icon from '../components/ui/Icon'
import type { Aparelho } from '../types'

interface VendedorStats {
  id: string; nome: string; totalVendas: number; numVendas: number; comissao: number
}

interface AnalyticsData {
  lucroMes: number; totalVendasMes: number; margemMedia: number; osEmAberto: number
  vendedores: VendedorStats[]; aparelhosParados: Aparelho[]; totalComissoes: number
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(50000)

  useEffect(() => {
    async function load() {
      const hoje = new Date()
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
      const [
        { data: vendasMes },
        { count: osAberto },
        { data: perfis },
        { data: todasVendas },
        { data: parados },
      ] = await Promise.all([
        supabase.from('vendas').select('*').gte('created_at', inicio),
        supabase.from('ordens_servico').select('id', { count: 'exact', head: true }).neq('status', 'Entregue'),
        supabase.from('perfis').select('id, nome, role'),
        supabase.from('vendas').select('vendedor_id, preco_venda, comissao_pct, lucro_liquido'),
        supabase.from('aparelhos').select('*').eq('status', 'Disponível'),
      ])
      const lucroMes = (vendasMes ?? []).reduce((s, v) => s + (v.lucro_liquido ?? 0), 0)
      const totalVendasMes = (vendasMes ?? []).reduce((s, v) => s + (v.preco_venda ?? 0), 0)
      const margemMedia = totalVendasMes > 0 ? (lucroMes / totalVendasMes) * 100 : 0
      const vendedorMap: Record<string, VendedorStats> = {}
      for (const p of (perfis ?? [])) {
        if (p.role === 'vendedor') vendedorMap[p.id] = { id: p.id, nome: p.nome, totalVendas: 0, numVendas: 0, comissao: 0 }
      }
      for (const v of (todasVendas ?? [])) {
        if (v.vendedor_id && vendedorMap[v.vendedor_id]) {
          vendedorMap[v.vendedor_id].totalVendas += v.preco_venda ?? 0
          vendedorMap[v.vendedor_id].numVendas += 1
          vendedorMap[v.vendedor_id].comissao += (v.preco_venda ?? 0) * ((v.comissao_pct ?? 0) / 100)
        }
      }
      const vendedores = Object.values(vendedorMap).sort((a, b) => b.totalVendas - a.totalVendas)
      const totalComissoes = vendedores.reduce((s, v) => s + v.comissao, 0)
      const aparelhosParados = ((parados ?? []) as Aparelho[]).filter((a) => daysSince(a.data_entrada) > 15)
      setData({ lucroMes, totalVendasMes, margemMedia, osEmAberto: osAberto ?? 0, vendedores, aparelhosParados, totalComissoes })
      setLoading(false)
    }
    load()
  }, [])

  function exportVendedoresCsv() {
    if (!data) return
    const cols = ['Nome', 'Faturamento', 'Nº Vendas', 'Comissão']
    const rows = data.vendedores.map((v) => [v.nome, v.totalVendas.toFixed(2), v.numVendas, v.comissao.toFixed(2)])
    const csv = [cols, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'vendedores.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-white/10 border-t-teal-400 rounded-full animate-spin" />
      </div>
    )
  }
  if (!data) return null

  const progressPct = Math.min(100, (data.totalVendasMes / meta) * 100)

  return (
    <div className="fade flex flex-col gap-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.15)] relative">
            <div className="absolute inset-0 bg-indigo-500/20 mix-blend-overlay blur-md rounded-2xl"></div>
            <Icon name="insights" size={28} className="text-indigo-400 relative z-10" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics & Reports</h1>
            <p className="text-zinc-400 mt-1 text-sm tracking-wide">Visão executiva de performance financeira e vendas.</p>
          </div>
        </div>
        <button onClick={exportVendedoresCsv} className="btn-ghost" title="Exportar CSV">
          <Icon name="download" size={18} /> Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Lucro Líquido do Mês', value: formatCurrency(data.lucroMes), icon: 'trending_up', color: '#10b981', bgContext: 'border-emerald-500/20 bg-emerald-500/5' },
          { label: 'Gross Faturamento', value: formatCurrency(data.totalVendasMes), icon: 'payments', color: '#0ea5e9', bgContext: 'border-sky-500/20 bg-sky-500/5' },
          { label: 'Margem Média', value: `${data.margemMedia.toFixed(1)}%`, icon: 'percent', color: data.margemMedia < 8 ? '#f59e0b' : '#10b981', bgContext: data.margemMedia < 8 ? 'border-amber-500/20 bg-amber-500/5' : 'border-emerald-500/20 bg-emerald-500/5' },
          { label: 'OS Office', value: String(data.osEmAberto), icon: 'build', color: '#8b5cf6', bgContext: 'border-violet-500/20 bg-violet-500/5' },
        ].map((k) => (
          <div key={k.label} className={`glass-panel p-5 flex items-center gap-4 ${k.bgContext} relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-[40px] opacity-30 pointer-events-none group-hover:opacity-60 transition-opacity duration-700`} style={{ background: k.color }} />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border z-10 bg-black/20" style={{ color: k.color, borderColor: `color-mix(in srgb, ${k.color} 30%, transparent)` }}>
              <Icon name={k.icon} size={24} />
            </div>
            <div className="z-10">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{k.label}</p>
              <p className="text-2xl font-black text-white tracking-tight leading-tight mt-0.5">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Meta Tracker */}
      <div className="glass-panel p-6 border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/5 via-transparent to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Icon name="flag" size={20} className="text-blue-400" /> Meta de Faturamento Mensal
            </h2>
            <p className="text-sm text-zinc-400">Acompanhe o desenvolvimento do mês</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Adjust Meta:</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">R$</span>
              <input
                type="number"
                value={meta}
                onChange={(e) => setMeta(Number(e.target.value))}
                className="w-32 bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all font-sans"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mb-2 relative z-10">
          <span className="text-2xl font-black text-white">{formatCurrency(data.totalVendasMes)} <span className="text-sm text-zinc-500 font-bold">/ {formatCurrency(meta)}</span></span>
          <span className={`text-xl font-black tracking-tight ${progressPct >= 100 ? 'text-emerald-400' : progressPct >= 70 ? 'text-blue-400' : 'text-amber-400'}`}>
            {progressPct.toFixed(1)}%
          </span>
        </div>

        <div className="h-3 rounded-full bg-white/5 overflow-hidden relative z-10 border border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${progressPct >= 100 ? 'bg-emerald-500' : progressPct >= 70 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute inset-0 bg-white/20 w-full skew-x-[-20deg] animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Vendedores */}
        <div className="xl:col-span-2 glass-panel p-0 border-white/5 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.01]">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Icon name="groups" size={20} className="text-indigo-400" /> Leaderboard de Vendas
            </h2>
          </div>
          {data.vendedores.length === 0 ? (
            <div className="flex items-center justify-center p-10 text-zinc-500 text-sm font-medium">
              Nenhum vendedor cadastrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-white/[0.02]">
                    {['Rank', 'Vendedor', 'Volume Sales', 'Qtd', 'ComissionPayout'].map((h) => (
                      <th key={h} className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] border-b border-white/5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.vendedores.map((v, i) => (
                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 font-black">
                        {i === 0 ? <Icon name="emoji_events" size={20} className="text-amber-400" /> : <span className="text-zinc-500 text-sm">#{i + 1}</span>}
                      </td>
                      <td className="p-4 font-bold text-white group-hover:text-indigo-400 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-400 shrink-0">
                            {v.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          {v.nome}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-white tracking-wide">{formatCurrency(v.totalVendas)}</td>
                      <td className="p-4 text-zinc-400">{v.numVendas}</td>
                      <td className="p-4 font-bold text-amber-400 tracking-wide">{formatCurrency(v.comissao)}</td>
                    </tr>
                  ))}
                  <tr className="bg-amber-500/5">
                    <td colSpan={4} className="p-4 font-bold text-zinc-300 text-right uppercase tracking-widest text-xs">Sum Comissions Payout:</td>
                    <td className="p-4 font-black text-amber-400 text-lg tracking-tight">{formatCurrency(data.totalComissoes)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Capital Imobilizado */}
        {data.aparelhosParados.length > 0 && (
          <div className="glass-panel p-0 border-white/5 overflow-hidden border border-red-500/20">
            <div className="flex items-center gap-2 p-5 border-b border-red-500/10 bg-red-500/5">
              <Icon name="warning" size={20} className="text-red-400" />
              <h2 className="text-base font-bold text-red-400">Capital Imobilizado (+15d)</h2>
            </div>
            <div className="p-0 overflow-y-auto max-h-[400px]">
              <div className="flex flex-col">
                {data.aparelhosParados.map(ap => (
                  <div key={ap.id} className="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-white text-sm">{ap.modelo} {ap.storage}</span>
                      <span className="text-xs font-black bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">{daysSince(ap.data_entrada)} dias</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-mono text-zinc-500">{ap.imei}</span>
                      <span className="font-bold text-sm text-zinc-300">{formatCurrency(ap.preco_venda)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-red-500/5 border-t border-red-500/10 flex justify-between items-center">
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Total Preso</span>
              <span className="font-black text-red-400 text-lg">
                {formatCurrency(data.aparelhosParados.reduce((acc, ap) => acc + (ap.preco_venda ?? 0), 0))}
              </span>
            </div>
          </div>
        )}

      </div>

    </div>
  )
}
