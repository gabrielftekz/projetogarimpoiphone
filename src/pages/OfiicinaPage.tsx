import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { formatBRL, parseBRL, brlToRaw } from '../lib/utils'
import Modal from '../components/ui/Modal'
import Icon from '../components/ui/Icon'
import KanbanColumn from '../components/oficina/KanbanColumn'
import type { OrdemServico, OSStatus } from '../types'

const STATUS_OPTIONS: OSStatus[] = ['Aguardando Peça', 'Em Andamento', 'Pronto', 'Entregue']

const COLUMNS = [
  { id: 'col1', title: 'Aguardando Peça', dotColor: '#ef4444', status: 'Aguardando Peça' as OSStatus },
  { id: 'col2', title: 'Em Andamento', dotColor: '#0ea5e9', status: 'Em Andamento' as OSStatus },
  { id: 'col3', title: 'Pronto', dotColor: '#22c55e', status: 'Pronto' as OSStatus },
  { id: 'col4', title: 'Entregue', dotColor: '#a1a1aa', status: 'Entregue' as OSStatus },
]

interface FormState {
  cliente_nome: string
  cliente_tel: string
  modelo: string
  problema: string
  tecnico: string
  status: OSStatus
  valor: string
  data_previsao: string
}

const EMPTY: FormState = {
  cliente_nome: '', cliente_tel: '', modelo: '', problema: '',
  tecnico: '', status: 'Aguardando Peça', valor: '', data_previsao: '',
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function maskDate(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

function dateToISO(masked: string) {
  const p = masked.split('/')
  if (p.length === 3 && p[2].length === 4) return `${p[2]}-${p[1]}-${p[0]}`
  return ''
}

function isoToMasked(iso: string) {
  if (!iso) return ''
  const p = iso.slice(0, 10).split('-')
  if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`
  return ''
}

const inputClassName = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all font-sans placeholder-zinc-500"

function StatusSelect({ value, onChange }: { value: OSStatus; onChange: (v: OSStatus) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} className={`${inputClassName} flex items-center justify-between cursor-pointer`}>
        <span>{value}</span>
        <Icon name="expand_more" size={18} className={`text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-[105%] left-0 right-0 z-50 bg-[#121214] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-3xl py-1">
          {STATUS_OPTIONS.map(s => (
            <button key={s} type="button" onClick={() => { onChange(s); setOpen(false) }}
              className={`w-full text-left px-4 py-3 text-sm font-sans cursor-pointer transition-colors
                ${s === value ? 'bg-teal-500/10 text-teal-400 font-bold' : 'text-zinc-300 font-medium hover:bg-white/5'}
              `}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function OfiicinaPage() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editOs, setEditOs] = useState<OrdemServico | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [fetchError, setFetchError] = useState('')

  const searchRef = useRef(search)
  useEffect(() => { searchRef.current = search }, [search])

  const fetchOrdens = useCallback(async (searchTerm: string) => {
    setLoading(true)
    let q = supabase.from('ordens_servico').select('*').order('created_at', { ascending: false })
    if (searchTerm.trim()) {
      q = q.or(`cliente_nome.ilike.%${searchTerm}%,modelo.ilike.%${searchTerm}%`)
    }
    const { data, error } = await q
    if (error) {
      console.error('[Oficina] Erro ao buscar ordens de serviço:', error)
      setFetchError(`Erro ao carregar ordens: ${error.message}`)
    } else if (data) {
      setOrdens(data as OrdemServico[])
      setFetchError('')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrdens(search)
  }, [search, fetchOrdens])

  function openCreate() {
    setEditOs(null)
    setForm(EMPTY)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(os: OrdemServico) {
    setEditOs(os)
    setForm({
      cliente_nome: os.cliente_nome,
      cliente_tel: maskPhone(os.cliente_tel ?? ''),
      modelo: os.modelo,
      problema: os.problema ?? '',
      tecnico: os.tecnico ?? '',
      status: os.status,
      valor: os.valor != null ? brlToRaw(os.valor) : '',
      data_previsao: os.data_previsao ? isoToMasked(os.data_previsao) : '',
    })
    setFormError('')
    setModalOpen(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.cliente_nome.trim()) { setFormError('Informe o nome do cliente.'); return }
    if (!form.modelo.trim()) { setFormError('Informe o modelo do aparelho.'); return }

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    const payload = {
      cliente_nome: form.cliente_nome.trim(),
      cliente_tel: form.cliente_tel,
      modelo: form.modelo.trim(),
      problema: form.problema.trim(),
      tecnico: form.tecnico.trim(),
      status: form.status,
      valor: form.valor ? parseBRL(form.valor) : null,
      data_previsao: form.data_previsao ? (dateToISO(form.data_previsao) || null) : null,
    }

    let error
    if (editOs) {
      const res = await supabase.from('ordens_servico').update(payload).eq('id', editOs.id)
      error = res.error
    } else {
      const res = await supabase.from('ordens_servico').insert({ ...payload, vendedor_id: user?.id ?? null })
      error = res.error
    }

    setSaving(false)

    if (error) {
      setFormError(error.message)
      return
    }

    setModalOpen(false)
    await fetchOrdens(searchRef.current)
  }

  async function handleAdvance(id: string, status: OSStatus) {
    await supabase.from('ordens_servico').update({ status }).eq('id', id)
    await fetchOrdens(searchRef.current)
  }

  const dragOs = useRef<OrdemServico | null>(null)

  const handleDragStart = useCallback((_e: React.DragEvent, os: OrdemServico) => {
    dragOs.current = os
  }, [])

  const handleDrop = useCallback(async (targetStatus: OSStatus) => {
    const os = dragOs.current
    dragOs.current = null
    if (!os || os.status === targetStatus) return
    await supabase.from('ordens_servico').update({ status: targetStatus }).eq('id', os.id)
    await fetchOrdens(searchRef.current)
  }, [fetchOrdens])

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from('ordens_servico').delete().eq('id', id)
    await fetchOrdens(searchRef.current)
  }, [fetchOrdens])

  const kpis = {
    emAberto: ordens.filter(o => o.status !== 'Entregue').length,
    aguardandoPeca: ordens.filter(o => o.status === 'Aguardando Peça').length,
    emAndamento: ordens.filter(o => o.status === 'Em Andamento').length,
    prontos: ordens.filter(o => o.status === 'Pronto').length,
  }

  return (
    <div className="fade flex flex-col gap-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(20,184,166,0.15)] relative">
            <div className="absolute inset-0 bg-teal-500/20 mix-blend-overlay blur-md rounded-2xl"></div>
            <Icon name="build" size={28} className="text-teal-400 relative z-10" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Oficina & Reparos</h1>
            <p className="text-zinc-400 mt-1 text-sm tracking-wide">Acompanhe o status e pipeline de serviços.</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Icon name="add" size={20} /> Nova OS
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Em Aberto', value: kpis.emAberto, icon: 'build', color: '#3b82f6', bgContext: 'border-blue-500/20 bg-blue-500/5', shadow: 'rgba(59,130,246,0.15)' },
          { label: 'Aguard. Peça', value: kpis.aguardandoPeca, icon: 'hourglass_empty', color: '#ef4444', bgContext: 'border-red-500/20 bg-red-500/5', shadow: 'rgba(239,68,68,0.15)' },
          { label: 'Em Andamento', value: kpis.emAndamento, icon: 'construction', color: '#0ea5e9', bgContext: 'border-sky-500/20 bg-sky-500/5', shadow: 'rgba(14,165,233,0.15)' },
          { label: 'Prontos', value: kpis.prontos, icon: 'check_circle', color: '#22c55e', bgContext: 'border-emerald-500/20 bg-emerald-500/5', shadow: 'rgba(34,197,94,0.15)' },
        ].map(k => (
          <div key={k.label} className={`glass-panel p-5 flex items-center gap-4 ${k.bgContext} relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-50 pointer-events-none" style={{ background: k.color }} />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border" style={{ background: `color-mix(in srgb, ${k.color} 10%, transparent)`, color: k.color, borderColor: `color-mix(in srgb, ${k.color} 20%, transparent)` }}>
              <Icon name={k.icon} size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{k.label}</p>
              <p className="text-2xl font-black text-white tracking-tight leading-tight mt-0.5">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Busca */}
      <form onSubmit={e => { e.preventDefault(); setSearch(searchInput) }} className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por cliente ou modelo..."
            className={`${inputClassName} pl-11`}
          />
        </div>
        <button type="submit" className="btn-primary px-6">Buscar</button>
        {search && (
          <button type="button" className="btn-ghost px-5" onClick={() => { setSearch(''); setSearchInput('') }}>
            Limpar
          </button>
        )}
      </form>

      {fetchError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
          {fetchError}
        </div>
      )}

      {/* Kanban Board */}
      <div className="glass-panel p-6 border-white/5 overflow-x-auto min-h-[600px]">
        <div className="flex gap-6 min-w-[1000px] h-full items-start">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              title={col.title}
              dotColor={col.dotColor}
              status={col.status}
              orders={ordens.filter(o => o.status === col.status)}
              onEdit={openEdit}
              onAdvance={handleAdvance}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDelete={handleDelete}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {/* Modal Nova/Editar OS */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editOs ? `Update Order #${editOs.id.slice(0, 8)}` : 'Nova Ordem de Serviço'} width="650px">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Cliente *</label>
              <input value={form.cliente_nome} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))} placeholder="Nome do cliente" className={inputClassName} />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Telefone</label>
              <input value={form.cliente_tel} onChange={e => setForm(f => ({ ...f, cliente_tel: maskPhone(e.target.value) }))} placeholder="(00) 00000-0000" className={inputClassName} />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Modelo *</label>
              <input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} placeholder="Ex: Samsung Galaxy A54" className={inputClassName} />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Técnico Responsável</label>
              <input value={form.tecnico} onChange={e => setForm(f => ({ ...f, tecnico: e.target.value }))} placeholder="Nome do técnico" className={inputClassName} />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Problema Relatado</label>
              <textarea value={form.problema} onChange={e => setForm(f => ({ ...f, problema: e.target.value }))} placeholder="Descreva o problema com detalhes..." rows={3} className={`${inputClassName} resize-y min-h-[100px]`} />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Status Inicial</label>
              <StatusSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Valor Total (R$)</label>
              <input value={form.valor} onChange={e => setForm(f => ({ ...f, valor: formatBRL(e.target.value) }))} placeholder="0,00" className={inputClassName} />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Data Previsão Entrega</label>
              <div className="relative">
                <Icon name="calendar_today" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input value={form.data_previsao} onChange={e => setForm(f => ({ ...f, data_previsao: maskDate(e.target.value) }))} placeholder="dd/mm/aaaa" maxLength={10} className={`${inputClassName} pl-11`} />
              </div>
            </div>

          </div>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
            <button type="button" className="btn-ghost px-6" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="button" className="btn-primary px-8" disabled={saving} onClick={handleSave} style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Processing...' : editOs ? 'Save Changes' : 'Initialize Order'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
