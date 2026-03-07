import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/utils'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import Icon from '../components/ui/Icon'
import type { Aparelho, AparelhoStatus } from '../types'

const STATUS_FILTERS: (AparelhoStatus | 'Todos')[] = ['Todos', 'Disponível', 'Reservado', 'Vendido', 'Na Oficina']
const STORAGE_OPTIONS = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB']
const PAGE_SIZE = 15

interface FormData {
  modelo: string
  storage: string
  cor: string
  imei: string
  bateria_pct: number
  preco_compra: number
  preco_venda: number
  status: AparelhoStatus
}

const EMPTY_FORM: FormData = {
  modelo: '',
  storage: '128GB',
  cor: '',
  imei: '',
  bateria_pct: 100,
  preco_compra: 0,
  preco_venda: 0,
  status: 'Disponível',
}

const inputStyle = {
  border: '1px solid #EDE8E0',
  borderRadius: 10,
  padding: '9px 12px',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'Nunito, sans-serif',
  color: '#4A443F',
  width: '100%',
  background: '#fff',
  boxSizing: 'border-box' as const,
}

export default function EstoquePage() {
  const { isAdmin } = useAuth()
  const [aparelhos, setAparelhos] = useState<Aparelho[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<AparelhoStatus | 'Todos'>('Todos')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [kpis, setKpis] = useState({ totalEstoque: 0, custoTotal: 0, disponiveis: 0 })

  const loadKpis = useCallback(async () => {
    const { data } = await supabase.from('aparelhos').select('preco_venda, preco_compra, status')
    if (!data) return
    const disp = data.filter((a) => a.status === 'Disponível')
    setKpis({
      totalEstoque: disp.reduce((s, a) => s + (a.preco_venda ?? 0), 0),
      custoTotal: disp.reduce((s, a) => s + (a.preco_compra ?? 0), 0),
      disponiveis: disp.length,
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('aparelhos').select('*', { count: 'exact' })
    if (statusFilter !== 'Todos') q = q.eq('status', statusFilter)
    if (search) q = q.or(`modelo.ilike.%${search}%,imei.ilike.%${search}%`)
    const from = (page - 1) * PAGE_SIZE
    const { data, count } = await q.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1)
    setAparelhos((data ?? []) as Aparelho[])
    setTotal(count ?? 0)
    setLoading(false)
  }, [statusFilter, search, page])

  useEffect(() => { load(); loadKpis() }, [load, loadKpis])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  async function handleSave() {
    setFormError('')
    if (!form.modelo || !form.imei || !form.cor) {
      setFormError('Preencha modelo, IMEI e cor.')
      return
    }
    if (form.imei.replace(/\D/g, '').length !== 15) {
      setFormError('IMEI deve ter 15 dígitos.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('aparelhos').insert([{ ...form, imei: form.imei.trim() }])
    if (error) {
      setFormError(error.message.includes('unique') ? 'Este IMEI já está cadastrado.' : error.message)
      setSaving(false)
      return
    }
    setModalOpen(false)
    setForm(EMPTY_FORM)
    load()
    loadKpis()
    setSaving(false)
  }

  function exportCsv() {
    const cols = isAdmin
      ? ['Modelo', 'Storage', 'Cor', 'IMEI', 'Bateria%', 'Compra', 'Venda', 'Status', 'Entrada']
      : ['Modelo', 'Storage', 'Cor', 'IMEI', 'Bateria%', 'Venda', 'Status', 'Entrada']
    const rows = aparelhos.map((a) =>
      isAdmin
        ? [a.modelo, a.storage, a.cor, a.imei, a.bateria_pct, a.preco_compra, a.preco_venda, a.status, formatDate(a.data_entrada)]
        : [a.modelo, a.storage, a.cor, a.imei, a.bateria_pct, a.preco_venda, a.status, formatDate(a.data_entrada)]
    )
    const csv = [cols, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'estoque.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#4A443F' }}>Estoque</h1>
          <p style={{ margin: '4px 0 0', color: '#9A948E', fontSize: 14 }}>Gerencie seus aparelhos em estoque</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && (
            <button onClick={exportCsv} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="download" size={16} /> Exportar
            </button>
          )}
          {isAdmin && (
            <button onClick={() => { setForm(EMPTY_FORM); setModalOpen(true) }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="add" size={18} /> Novo Aparelho
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 16 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#EEF3E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="smartphone" size={22} style={{ color: '#5D6D3E' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#9A948E', fontWeight: 600 }}>Disponíveis</p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#5D6D3E' }}>{kpis.disponiveis}</p>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#EBF5FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="payments" size={22} style={{ color: '#0EA5E9' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#9A948E', fontWeight: 600 }}>Valor em Estoque</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#4A443F' }}>{formatCurrency(kpis.totalEstoque)}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="receipt_long" size={22} style={{ color: '#D97706' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#9A948E', fontWeight: 600 }}>Custo Total</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#4A443F' }}>{formatCurrency(kpis.custoTotal)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #F0EBE3' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className="seg-btn"
                style={{
                  background: statusFilter === s ? '#5D6D3E' : 'transparent',
                  color: statusFilter === s ? '#fff' : '#9A948E',
                  fontWeight: statusFilter === s ? 700 : 600,
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Icon name="search" size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#B5AFA9' }} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar modelo ou IMEI..."
                style={{ ...inputStyle, paddingLeft: 32 }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '9px 16px' }}>Buscar</button>
          </form>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
            <div style={{ width: 28, height: 28, border: '3px solid #EEF3E5', borderTopColor: '#5D6D3E', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : aparelhos.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 8, color: '#B5AFA9' }}>
            <Icon name="inventory_2" size={36} style={{ color: '#D6D0C8' }} />
            <span style={{ fontSize: 14 }}>Nenhum aparelho encontrado</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAF7F2' }}>
                  {['Modelo', 'Storage', 'Cor', 'IMEI', 'Bateria', ...(isAdmin ? ['Compra'] : []), 'Venda', 'Status', 'Entrada'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid #F0EBE3', fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aparelhos.map((ap) => (
                  <tr key={ap.id} className="row-hover">
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#4A443F' }}>{ap.modelo}</td>
                    <td style={{ padding: '11px 16px', color: '#9A948E' }}>{ap.storage}</td>
                    <td style={{ padding: '11px 16px', color: '#9A948E' }}>{ap.cor}</td>
                    <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: 12, color: '#9A948E' }}>{ap.imei}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ fontWeight: 700, color: ap.bateria_pct < 70 ? '#DC2626' : ap.bateria_pct < 80 ? '#D97706' : '#16A34A', display: 'flex', alignItems: 'center', gap: 3 }}>
                        {ap.bateria_pct < 80 && <Icon name="battery_alert" size={13} style={{ color: ap.bateria_pct < 70 ? '#DC2626' : '#D97706' }} />}
                        {ap.bateria_pct}%
                      </span>
                    </td>
                    {isAdmin && <td style={{ padding: '11px 16px', color: '#9A948E' }}>{formatCurrency(ap.preco_compra)}</td>}
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#4A443F' }}>{formatCurrency(ap.preco_venda)}</td>
                    <td style={{ padding: '11px 16px' }}><Badge status={ap.status} /></td>
                    <td style={{ padding: '11px 16px', color: '#9A948E', whiteSpace: 'nowrap' }}>{formatDate(ap.data_entrada)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding: '12px 20px' }}>
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Aparelho">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Modelo *</label>
              <input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} placeholder="Ex: iPhone 15 Pro Max" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Armazenamento</label>
              <select value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value })} style={inputStyle}>
                {STORAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Cor *</label>
              <input value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} placeholder="Ex: Titânio Preto" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>IMEI * (15 dígitos)</label>
              <input value={form.imei} onChange={(e) => setForm({ ...form, imei: e.target.value.replace(/\D/g, '').slice(0, 15) })} placeholder="000000000000000\" style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Bateria %</label>
              <input type="number" min={0} max={100} value={form.bateria_pct} onChange={(e) => setForm({ ...form, bateria_pct: Math.min(100, Math.max(0, Number(e.target.value))) })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AparelhoStatus })} style={inputStyle}>
                <option>Disponível</option><option>Reservado</option><option>Vendido</option><option>Na Oficina</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Preço de Compra (R$)</label>
              <input type="number" min={0} step={0.01} value={form.preco_compra} onChange={(e) => setForm({ ...form, preco_compra: Number(e.target.value) })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Preço de Venda (R$)</label>
              <input type="number" min={0} step={0.01} value={form.preco_venda} onChange={(e) => setForm({ ...form, preco_venda: Number(e.target.value) })} style={inputStyle} />
            </div>
          </div>

          {formError && (
            <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 12px', fontSize: 13 }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button onClick={() => setModalOpen(false)} className="btn-ghost">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando...' : 'Salvar Aparelho'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
