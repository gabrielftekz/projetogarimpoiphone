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

const inputClassName = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all font-sans placeholder-zinc-500"

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
    <div className="fade flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Estoque</h1>
          <p className="text-zinc-400 mt-1 text-sm">Gerencie seus aparelhos em estoque com visão estratégica.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <button onClick={exportCsv} className="btn-ghost" title="Exportar CSV">
              <Icon name="download" size={18} /> <span className="hidden sm:inline">Exportar</span>
            </button>
          )}
          {isAdmin && (
            <button onClick={() => { setForm(EMPTY_FORM); setModalOpen(true) }} className="btn-primary">
              <Icon name="add" size={20} /> <span className="hidden sm:inline">Novo Aparelho</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <div className="glass-panel p-6 flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/20 rounded-full blur-2xl group-hover:bg-teal-500/30 transition-all pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
            <Icon name="smartphone" size={24} className="text-teal-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-teal-400/80 uppercase tracking-widest mb-1">Disponíveis</p>
            <p className="text-3xl font-black text-white tracking-tight">{kpis.disponiveis}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Icon name="payments" size={24} className="text-blue-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-blue-400/80 uppercase tracking-widest mb-1">Valor em Estoque</p>
            <p className="text-2xl font-black text-white tracking-tight">{formatCurrency(kpis.totalEstoque)}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="glass-panel p-6 flex items-center gap-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/30 transition-all pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <Icon name="receipt_long" size={24} className="text-orange-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-orange-400/80 uppercase tracking-widest mb-1">Custo Total</p>
              <p className="text-2xl font-black text-white tracking-tight">{formatCurrency(kpis.custoTotal)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="glass-panel overflow-hidden border-white/10">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-5 md:p-6 border-b border-white/5 bg-white/[0.01]">
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            {STATUS_FILTERS.map((s) => {
              const isActive = statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1) }}
                  className={`px-4 py-2 text-[13px] font-bold rounded-lg transition-all border ${isActive
                      ? 'bg-white/10 text-white border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                      : 'bg-transparent text-zinc-500 border-transparent hover:bg-white/5 hover:text-zinc-300'
                    }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
          <form onSubmit={handleSearchSubmit} className="flex gap-3 w-full xl:w-80">
            <div className="relative flex-1">
              <Icon name="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar modelo ou IMEI..."
                className={`${inputClassName} pl-11 py-2`}
              />
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-white/10 border-t-teal-400 rounded-full animate-spin" />
          </div>
        ) : aparelhos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-zinc-500">
            <Icon name="inventory_2" size={48} className="text-white/10" />
            <span className="text-sm font-medium">Nenhum aparelho encontrado</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-white/[0.02]">
                  {['Modelo', 'Storage', 'Cor', 'IMEI', 'Bateria', ...(isAdmin ? ['Compra'] : []), 'Venda', 'Status', 'Entrada'].map((h) => (
                    <th key={h} className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] border-b border-white/5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {aparelhos.map((ap) => (
                  <tr key={ap.id} className="hover:bg-white/[0.02] transition-colors group cursor-default">
                    <td className="p-4 font-bold text-white group-hover:text-teal-400 transition-colors">{ap.modelo}</td>
                    <td className="p-4 text-zinc-400 text-sm">{ap.storage}</td>
                    <td className="p-4 text-zinc-400 text-sm">{ap.cor}</td>
                    <td className="p-4 font-mono text-xs text-zinc-500 tracking-wider">{ap.imei}</td>
                    <td className="p-4">
                      <div className={`flex items-center gap-1.5 font-bold text-sm ${ap.bateria_pct < 70 ? 'text-red-400' : ap.bateria_pct < 80 ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {ap.bateria_pct < 80 && <Icon name="battery_alert" size={14} />}
                        {ap.bateria_pct}%
                      </div>
                    </td>
                    {isAdmin && <td className="p-4 text-zinc-400 text-sm tracking-wide">{formatCurrency(ap.preco_compra)}</td>}
                    <td className="p-4 font-bold text-white tracking-wide">{formatCurrency(ap.preco_venda)}</td>
                    <td className="p-4"><Badge status={ap.status} /></td>
                    <td className="p-4 text-zinc-500 text-xs">{formatDate(ap.data_entrada)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Aparelho na Base">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 z-10">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Modelo *</label>
              <input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} placeholder="Ex: iPhone 15 Pro Max" className={inputClassName} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Armazenamento</label>
              <select value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value })} className={inputClassName}>
                {STORAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Cor *</label>
              <input value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} placeholder="Ex: Titânio Preto" className={inputClassName} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">IMEI * <span className="text-zinc-500 lowercase font-normal">(15 dígitos)</span></label>
              <input value={form.imei} onChange={(e) => setForm({ ...form, imei: e.target.value.replace(/\D/g, '').slice(0, 15) })} placeholder="000000000000000" className={`${inputClassName} font-mono tracking-widest text-lg`} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Bateria %</label>
              <input type="number" min={0} max={100} value={form.bateria_pct} onChange={(e) => setForm({ ...form, bateria_pct: Math.min(100, Math.max(0, Number(e.target.value))) })} className={inputClassName} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Status Inicial</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AparelhoStatus })} className={inputClassName}>
                <option value="Disponível">Disponível</option>
                <option value="Reservado">Reservado</option>
                <option value="Vendido">Vendido</option>
                <option value="Na Oficina">Na Oficina</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Preço Compra (R$)</label>
              <input type="number" min={0} step={0.01} value={form.preco_compra} onChange={(e) => setForm({ ...form, preco_compra: Number(e.target.value) })} className={inputClassName} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Preço Venda (R$)</label>
              <input type="number" min={0} step={0.01} value={form.preco_venda} onChange={(e) => setForm({ ...form, preco_venda: Number(e.target.value) })} className={inputClassName} />
            </div>
          </div>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
            <button onClick={() => setModalOpen(false)} className="btn-ghost px-6">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className={`btn-primary px-8 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {saving ? 'Registrando...' : 'Finalizar Registro'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
