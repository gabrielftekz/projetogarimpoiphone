import Icon from '../ui/Icon'
import type { OrdemServico, OSStatus } from '../../types'
import { formatCurrency } from '../../lib/utils'

const SUBSTATUS: Record<OSStatus, string> = {
  'Aguardando Peça': 'Aguardando Peça',
  'Em Andamento': 'Na Bancada',
  'Pronto': 'Aguardando Retirada',
  'Entregue': 'Entregue',
}

const SUBSTATUS_COLORS: Record<OSStatus, { bg: string; color: string; border: string }> = {
  'Aguardando Peça': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)' },
  'Em Andamento': { bg: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: 'rgba(14, 165, 233, 0.2)' },
  'Pronto': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.2)' },
  'Entregue': { bg: 'rgba(161, 161, 170, 0.1)', color: '#a1a1aa', border: 'rgba(161, 161, 170, 0.2)' },
}

const BORDER_COLORS: Record<OSStatus, string> = {
  'Aguardando Peça': '#ef4444',
  'Em Andamento': '#0ea5e9',
  'Pronto': '#22c55e',
  'Entregue': '#a1a1aa',
}

interface KanbanCardProps {
  os: OrdemServico
  onEdit: (os: OrdemServico) => void
  onAdvance: (id: string, status: OSStatus) => void
  onDragStart: (e: React.DragEvent, os: OrdemServico) => void
  onDelete: (id: string) => void
}

export default function KanbanCard({ os, onEdit, onAdvance, onDragStart, onDelete }: KanbanCardProps) {
  const sc = SUBSTATUS_COLORS[os.status] ?? { bg: 'rgba(161, 161, 170, 0.1)', color: '#a1a1aa', border: 'rgba(161, 161, 170, 0.2)' }
  const borderColor = BORDER_COLORS[os.status] ?? '#a1a1aa'

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, os)}
      className="bg-white/5 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3 cursor-grab relative overflow-hidden group border border-white/5 hover:border-white/20 transition-all duration-300"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
      }}
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[30px] opacity-10 pointer-events-none group-hover:opacity-30 transition-opacity duration-500"
        style={{ background: borderColor }}
      />

      <div className="flex items-center justify-between gap-2 z-10">
        <span
          className="text-[9px] font-black tracking-widest uppercase border rounded-full px-2.5 py-1"
          style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
        >
          {SUBSTATUS[os.status]}
        </span>
        <span className="text-xs font-mono font-bold text-zinc-500">#{os.id.slice(0, 8)}</span>
      </div>

      <div className="z-10">
        <p className="m-0 text-[15px] font-bold text-white leading-snug">
          {os.problema ? `${os.problema.slice(0, 45)}${os.problema.length > 45 ? '...' : ''}` : os.modelo}
        </p>
        <p className="m-0 mt-1 text-xs text-zinc-400 font-medium">{os.modelo}</p>
      </div>

      <div className="flex items-center gap-2 z-10 mt-1">
        <Icon name="person" size={14} className="text-zinc-500" />
        <span className="text-xs font-semibold text-zinc-300 truncate">
          {os.cliente_nome}
        </span>
      </div>

      {os.valor && (
        <div className="flex items-center gap-2 z-10">
          <Icon name="payments" size={14} className="text-teal-500/70" />
          <span className="text-sm font-bold text-teal-400">{formatCurrency(os.valor)}</span>
        </div>
      )}

      <div className="flex gap-2 mt-3 z-10">
        {os.status === 'Aguardando Peça' && (
          <button
            onClick={() => onAdvance(os.id, 'Em Andamento')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-red-500/50 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
          >
            Iniciar Reparo <Icon name="arrow_forward" size={14} />
          </button>
        )}

        {os.status === 'Em Andamento' && (
          <button
            onClick={() => onAdvance(os.id, 'Pronto')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-sky-500/50 text-sky-400 text-xs font-bold hover:bg-sky-500 hover:text-white transition-colors"
          >
            Marcar Pronto <Icon name="check" size={14} />
          </button>
        )}

        {os.status === 'Pronto' && os.cliente_tel && (
          <a
            href={`https://wa.me/55${os.cliente_tel.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors"
          >
            <Icon name="chat" size={14} /> Avisar
          </a>
        )}

        {os.status === 'Pronto' && (
          <button
            onClick={() => onAdvance(os.id, 'Entregue')}
            className="flex items-center justify-center py-1.5 px-3 rounded-xl border border-emerald-500/50 text-emerald-400 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors"
          >
            <Icon name="check_circle" size={16} />
          </button>
        )}

        <button
          onClick={() => onEdit(os)}
          className="flex items-center justify-center w-8 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Editar"
        >
          <Icon name="edit" size={14} />
        </button>

        <button
          onClick={() => {
            if (window.confirm('Tem certeza que deseja excluir esta OS?')) onDelete(os.id)
          }}
          className="flex items-center justify-center w-8 rounded-xl bg-white/5 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          title="Excluir"
        >
          <Icon name="delete" size={14} />
        </button>
      </div>
    </div>
  )
}
