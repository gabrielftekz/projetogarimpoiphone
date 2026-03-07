import Icon from '../ui/Icon'
import type { OrdemServico, OSStatus } from '../../types'
import { formatCurrency } from '../../lib/utils'

const SUBSTATUS: Record<OSStatus, string> = {
  'Aguardando Peça': 'Aguardando Peça',
  'Em Andamento': 'Na Bancada',
  'Pronto': 'Aguardando Retirada',
  'Entregue': 'Entregue',
}

const SUBSTATUS_COLORS: Record<OSStatus, { bg: string; color: string }> = {
  'Aguardando Peça': { bg: '#FEF2F2', color: '#DC2626' },
  'Em Andamento': { bg: '#EBF5FB', color: '#0EA5E9' },
  'Pronto': { bg: '#F0FDF4', color: '#16A34A' },
  'Entregue': { bg: '#F8FAFC', color: '#9A948E' },
}

const BORDER_COLORS: Record<OSStatus, string> = {
  'Aguardando Peça': '#DC2626',
  'Em Andamento': '#0EA5E9',
  'Pronto': '#16A34A',
  'Entregue': '#9A948E',
}

interface KanbanCardProps {
  os: OrdemServico
  onEdit: (os: OrdemServico) => void
  onAdvance: (id: string, status: OSStatus) => void
  onDragStart: (e: React.DragEvent, os: OrdemServico) => void
  onDelete: (id: string) => void
}

export default function KanbanCard({ os, onEdit, onAdvance, onDragStart, onDelete }: KanbanCardProps) {
  const sc = SUBSTATUS_COLORS[os.status] ?? { bg: '#F8FAFC', color: '#9A948E' }
  const borderColor = BORDER_COLORS[os.status] ?? '#9A948E'

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, os)}
      style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #EDE8E0',
        borderLeft: `4px solid ${borderColor}`,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.15s, opacity 0.15s',
        cursor: 'grab',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.05)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
          background: sc.bg, color: sc.color, borderRadius: 20, padding: '3px 9px',
        }}>
          {SUBSTATUS[os.status]}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#B5AFA9', whiteSpace: 'nowrap' }}>#{os.id}</span>
      </div>

      <div>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#4A443F', lineHeight: 1.3 }}>
          {os.problema ? `${os.problema.slice(0, 40)}${os.problema.length > 40 ? '...' : ''}` : os.modelo}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9A948E' }}>{os.modelo}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="person" size={14} style={{ color: '#B5AFA9', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: '#6B6560' }}>
          <span style={{ color: '#9A948E' }}>Cliente: </span>
          <span style={{ fontWeight: 600, color: '#4A443F' }}>{os.cliente_nome}</span>
        </span>
      </div>

      {os.valor && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="payments" size={14} style={{ color: '#B5AFA9', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#5D6D3E' }}>{formatCurrency(os.valor)}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        {os.status === 'Aguardando Peça' && (
          <button
            onClick={() => onAdvance(os.id, 'Em Andamento')}
            style={{
              flex: 1, border: '1px solid #DC2626', background: 'transparent', color: '#DC2626',
              borderRadius: 10, padding: '7px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { const b = e.currentTarget; b.style.background = '#DC2626'; b.style.color = '#fff' }}
            onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = '#DC2626' }}
          >
            Iniciar Reparo
            <Icon name="arrow_forward" size={14} style={{ color: 'inherit' }} />
          </button>
        )}

        {os.status === 'Em Andamento' && (
          <button
            onClick={() => onAdvance(os.id, 'Pronto')}
            style={{
              flex: 1, border: '1px solid #0EA5E9', background: 'transparent', color: '#0EA5E9',
              borderRadius: 10, padding: '7px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { const b = e.currentTarget; b.style.background = '#0EA5E9'; b.style.color = '#fff' }}
            onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = '#0EA5E9' }}
          >
            Marcar como Pronto
            <Icon name="check" size={14} style={{ color: 'inherit' }} />
          </button>
        )}

        {os.status === 'Pronto' && os.cliente_tel && (
          <a
            href={`https://wa.me/55${os.cliente_tel.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, background: '#25D366', color: '#fff',
              borderRadius: 10, padding: '7px 0', fontSize: 13, fontWeight: 700,
              textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Icon name="phone" size={14} style={{ color: '#fff' }} />
            Avisar no WhatsApp
          </a>
        )}

        {os.status === 'Pronto' && (
          <button
            onClick={() => onAdvance(os.id, 'Entregue')}
            style={{
              flex: os.cliente_tel ? 0 : 1, border: '1px solid #16A34A', background: 'transparent', color: '#16A34A',
              borderRadius: 10, padding: '7px 10px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { const b = e.currentTarget; b.style.background = '#16A34A'; b.style.color = '#fff' }}
            onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = '#16A34A' }}
          >
            {!os.cliente_tel && 'Marcar Entregue'}
            <Icon name="check_circle" size={14} style={{ color: 'inherit' }} />
          </button>
        )}

        <button
          onClick={() => onEdit(os)}
          style={{
            border: '1px solid #EDE8E0', background: 'transparent', color: '#9A948E',
            borderRadius: 10, padding: '7px 10px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { const b = e.currentTarget; b.style.borderColor = '#5D6D3E'; b.style.color = '#5D6D3E' }}
          onMouseLeave={(e) => { const b = e.currentTarget; b.style.borderColor = '#EDE8E0'; b.style.color = '#9A948E' }}
        >
          <Icon name="edit" size={14} style={{ color: 'inherit' }} />
        </button>

        <button
          onClick={() => {
            if (window.confirm('Tem certeza que deseja excluir esta OS?')) onDelete(os.id)
          }}
          style={{
            border: '1px solid #EDE8E0', background: 'transparent', color: '#9A948E',
            borderRadius: 10, padding: '7px 10px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { const b = e.currentTarget; b.style.borderColor = '#DC2626'; b.style.color = '#DC2626' }}
          onMouseLeave={(e) => { const b = e.currentTarget; b.style.borderColor = '#EDE8E0'; b.style.color = '#9A948E' }}
        >
          <Icon name="delete" size={14} style={{ color: 'inherit' }} />
        </button>
      </div>
    </div>
  )
}
