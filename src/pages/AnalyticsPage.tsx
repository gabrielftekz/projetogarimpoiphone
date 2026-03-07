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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <div style={{ width: 32, height: 32, border: '3px solid #EEF3E5', borderTopColor: '#5D6D3E', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }
  if (!data) return null

  const progressPct = Math.min(100, (data.totalVendasMes / meta) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#4A443F' }}>Analytics</h1>
          <p style={{ margin: '4px 0 0', color: '#9A948E', fontSize: 14 }}>Visão consolidada do mês</p>
        </div>
        <button onClick={exportVendedoresCsv} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="download" size={16} /> Exportar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Lucro do Mês', value: formatCurrency(data.lucroMes), icon: 'trending_up', bg: '#F0FDF4', color: '#16A34A' },
          { label: 'Total de Vendas', value: formatCurrency(data.totalVendasMes), icon: 'payments', bg: '#EBF5FB', color: '#0EA5E9' },
          { label: 'Margem Média', value: `${data.margemMedia.toFixed(1)}%`, icon: 'percent', bg: data.margemMedia < 8 ? '#FFFBEB' : '#F0FDF4', color: data.margemMedia < 8 ? '#D97706' : '#16A34A' },
          { label: 'OS em Aberto', value: String(data.osEmAberto), icon: 'build', bg: '#FFF7ED', color: '#D97706' },
        ].map((k) => (
          <div key={k.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={k.icon} size={22} style={{ color: k.color }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#9A948E', fontWeight: 600 }}>{k.label}</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: k.color, fontFamily: 'Quicksand, sans-serif' }}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#4A443F' }}>Meta Mensal de Vendas</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#9A948E' }}>Meta:</span>
            <input type="number" value={meta} onChange={(e) => setMeta(Number(e.target.value))}
              style={{ border: '1px solid #EDE8E0', borderRadius: 10, padding: '4px 10px', width: 120, fontSize: 13, outline: 'none', fontFamily: 'Nunito, sans-serif', color: '#4A443F' }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: '#9A948E' }}>{formatCurrency(data.totalVendasMes)} de {formatCurrency(meta)}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: progressPct >= 100 ? '#16A34A' : progressPct >= 70 ? '#D97706' : '#DC2626' }}>
            {progressPct.toFixed(1)}%
          </span>
        </div>
        <div style={{ height: 12, borderRadius: 999, background: '#F0EBE3', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 999, transition: 'width 0.5s ease', width: `${progressPct}%`, background: progressPct >= 100 ? '#16A34A' : progressPct >= 70 ? '#D97706' : '#DC2626' }} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0EBE3' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#4A443F' }}>Performance por Vendedor</h2>
          <Icon name="people" size={18} style={{ color: '#9A948E' }} />
        </div>
        {data.vendedores.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80, color: '#B5AFA9', fontSize: 14 }}>
            Nenhum vendedor cadastrado
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAF7F2' }}>
                  {['#', 'Vendedor', 'Faturamento', 'Nº Vendas', 'Comissão a Pagar'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid #F0EBE3', fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.vendedores.map((v, i) => (
                  <tr key={v.id} className="row-hover">
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: i === 0 ? '#D97706' : '#9A948E' }}>#{i + 1}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#4A443F' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EEF3E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#5D6D3E', flexShrink: 0 }}>
                          {v.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        {v.nome}
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px', color: '#4A443F', fontWeight: 600 }}>{formatCurrency(v.totalVendas)}</td>
                    <td style={{ padding: '11px 16px', color: '#9A948E' }}>{v.numVendas}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: v.comissao > 0 ? '#D97706' : '#9A948E' }}>{formatCurrency(v.comissao)}</td>
                  </tr>
                ))}
                <tr style={{ background: '#FAF7F2' }}>
                  <td colSpan={4} style={{ padding: '11px 16px', fontWeight: 700, color: '#4A443F', textAlign: 'right', fontSize: 13 }}>Total Comissões:</td>
                  <td style={{ padding: '11px 16px', fontWeight: 800, color: '#D97706', fontFamily: 'Quicksand, sans-serif', fontSize: 15 }}>{formatCurrency(data.totalComissoes)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data.aparelhosParados.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', borderBottom: '1px solid #F0EBE3' }}>
            <Icon name="inventory_2" size={18} style={{ color: '#DC2626' }} />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#4A443F' }}>Capital Imobilizado (+15 dias parado)</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAF7F2' }}>
                  {['Modelo', 'Storage', 'Cor', 'IMEI', 'Venda', 'Entrada', 'Dias Parado'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid #F0EBE3', fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.aparelhosParados.map((ap) => (
                  <tr key={ap.id} className="row-hover">
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#4A443F' }}>{ap.modelo}</td>
                    <td style={{ padding: '11px 16px', color: '#9A948E' }}>{ap.storage}</td>
                    <td style={{ padding: '11px 16px', color: '#9A948E' }}>{ap.cor}</td>
                    <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: 12, color: '#9A948E' }}>{ap.imei}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#4A443F' }}>{formatCurrency(ap.preco_venda)}</td>
                    <td style={{ padding: '11px 16px', color: '#9A948E' }}>{formatDate(ap.data_entrada)}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#DC2626' }}>{daysSince(ap.data_entrada)} dias</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
