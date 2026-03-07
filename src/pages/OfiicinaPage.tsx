import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { formatBRL, parseBRL, brlToRaw } from '../lib/utils'
import Modal from '../components/ui/Modal'
import Icon from '../components/ui/Icon'
import KanbanColumn from '../components/oficina/KanbanColumn'
import type { OrdemServico, OSStatus } from '../types'

const STATUS_OPTIONS: OSStatus[] = ['Aguardando Peça', 'Em Andamento', 'Pronto', 'Entregue']

const COLUMNS = [
  { id: 'col1', title: 'Aguardando Peça', dotColor: '#DC2626', status: 'Aguardando Peça' as OSStatus },
  { id: 'col2', title: 'Em Andamento',    dotColor: '#0EA5E9', status: 'Em Andamento'    as OSStatus },
  { id: 'col3', title: 'Pronto',          dotColor: '#16A34A', status: 'Pronto'          as OSStatus },
  { id: 'col4', title: 'Entregue',        dotColor: '#9A948E', status: 'Entregue'        as OSStatus },
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
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

function maskDate(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`
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

const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#9A948E',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  display: 'block', marginBottom: 7, fontFamily: 'Nunito, sans-serif',
}

const inp: React.CSSProperties = {
  border: '1px solid #EDE8E0', borderRadius: 10, padding: '10px 14px',
  fontSize: 14, outline: 'none', fontFamily: 'Nunito, sans-serif',
  color: '#4A443F', width: '100%', background: '#fff', boxSizing: 'border-box',
}

function StatusSelect({ value, onChange }: { value: OSStatus; onChange: (v: OSStatus) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ ...inp, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <span>{value}</span>
        <Icon name="expand_more" size={18} style={{ color: '#9A948E', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999, background: '#fff', border: '1px solid #EDE8E0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.10)', overflow: 'hidden' }}>
          {STATUS_OPTIONS.map(s => (
            <button key={s} type="button" onClick={() => { onChange(s); setOpen(false) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 14, fontFamily: 'Nunito, sans-serif', fontWeight: s === value ? 700 : 400, color: s === value ? '#5D6D3E' : '#4A443F', background: s === value ? '#F2F5EC' : 'transparent', border: 'none', cursor: 'pointer' }}>
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

  // Usar ref para sempre ter o search atual dentro de callbacks assíncronos
  const searchRef = useRef(search)
  useEffect(() => { searchRef.current = search }, [search])

  async function fetchOrdens(searchTerm: string) {
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
  }

  useEffect(() => {
    fetchOrdens(search)
  }, [search])

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
      cliente_tel:  form.cliente_tel,
      modelo:       form.modelo.trim(),
      problema:     form.problema.trim(),
      tecnico:      form.tecnico.trim(),
      status:       form.status,
      valor:        form.valor ? parseBRL(form.valor) : null,
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

    // Fechar modal e recarregar com o search atual
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
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from('ordens_servico').delete().eq('id', id)
    await fetchOrdens(searchRef.current)
  }, [])

  const kpis = {
    emAberto:      ordens.filter(o => o.status !== 'Entregue').length,
    aguardandoPeca: ordens.filter(o => o.status === 'Aguardando Peça').length,
    emAndamento:   ordens.filter(o => o.status === 'Em Andamento').length,
    prontos:       ordens.filter(o => o.status === 'Pronto').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #EDE8E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#EEF3E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="build" size={22} style={{ color: '#5D6D3E' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#4A443F' }}>Oficina & Reparos</h1>
            <p style={{ margin: '2px 0 0', color: '#9A948E', fontSize: 13 }}>Acompanhe o status de cada serviço.</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="add" size={18} /> Nova OS
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Em Aberto',    value: kpis.emAberto,       icon: 'build',           bg: '#EBF5FB', color: '#0EA5E9' },
          { label: 'Aguard. Peça', value: kpis.aguardandoPeca, icon: 'hourglass_empty',  bg: '#FEF2F2', color: '#DC2626' },
          { label: 'Em Andamento', value: kpis.emAndamento,    icon: 'construction',     bg: '#EBF5FB', color: '#0EA5E9' },
          { label: 'Prontos',      value: kpis.prontos,        icon: 'check_circle',     bg: '#F0FDF4', color: '#16A34A' },
        ].map(k => (
          <div key={k.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={k.icon} size={20} style={{ color: k.color }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#9A948E', fontWeight: 600 }}>{k.label}</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Busca */}
      <form onSubmit={e => { e.preventDefault(); setSearch(searchInput) }} style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Icon name="search" size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#B5AFA9' }} />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Buscar cliente ou modelo..."
            style={{ ...inp, paddingLeft: 36 }} />
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '9px 18px' }}>Buscar</button>
        {search && (
          <button type="button" className="btn-ghost" style={{ padding: '9px 14px' }}
            onClick={() => { setSearch(''); setSearchInput('') }}>Limpar</button>
        )}
      </form>

      {/* Erro de carregamento */}
      {fetchError && (
        <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 13 }}>
          {fetchError}
        </div>
      )}

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }}>
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

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editOs ? `Editar ${editOs.id}` : 'Nova Ordem de Serviço'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            <div>
              <label style={lbl}>Cliente *</label>
              <input value={form.cliente_nome} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))} placeholder="Nome do cliente" style={inp} />
            </div>

            <div>
              <label style={lbl}>Telefone</label>
              <input value={form.cliente_tel} onChange={e => setForm(f => ({ ...f, cliente_tel: maskPhone(e.target.value) }))} placeholder="(00) 00000-0000" style={inp} />
            </div>

            <div>
              <label style={lbl}>Modelo *</label>
              <input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} placeholder="Ex: Samsung Galaxy A54" style={inp} />
            </div>

            <div>
              <label style={lbl}>Técnico</label>
              <input value={form.tecnico} onChange={e => setForm(f => ({ ...f, tecnico: e.target.value }))} placeholder="Nome do técnico" style={inp} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Problema</label>
              <textarea value={form.problema} onChange={e => setForm(f => ({ ...f, problema: e.target.value }))} placeholder="Descreva o problema..." rows={2} style={{ ...inp, resize: 'vertical' }} />
            </div>

            <div>
              <label style={lbl}>Status</label>
              <StatusSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} />
            </div>

            <div>
              <label style={lbl}>Valor (R$)</label>
              <input value={form.valor} onChange={e => setForm(f => ({ ...f, valor: formatBRL(e.target.value) }))} placeholder="0,00" style={inp} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Previsão de Entrega</label>
              <div style={{ position: 'relative' }}>
                <input value={form.data_previsao} onChange={e => setForm(f => ({ ...f, data_previsao: maskDate(e.target.value) }))} placeholder="dd/mm/aaaa" maxLength={10} style={inp} />
                <Icon name="calendar_today" size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#B5AFA9', pointerEvents: 'none' }} />
              </div>
            </div>

          </div>

          {formError && (
            <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 12px', fontSize: 13 }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="button" className="btn-primary" disabled={saving} onClick={handleSave} style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando...' : editOs ? 'Salvar Alterações' : 'Criar OS'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
