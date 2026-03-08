import { cn } from '../../lib/utils'

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; shadow: string }> = {
  'Disponível': { bg: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: 'rgba(52, 211, 153, 0.2)', shadow: 'rgba(52, 211, 153, 0.4)' },
  'disponivel': { bg: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: 'rgba(52, 211, 153, 0.2)', shadow: 'rgba(52, 211, 153, 0.4)' },
  'Vendido': { bg: 'rgba(161, 161, 170, 0.1)', color: '#a1a1aa', border: 'rgba(161, 161, 170, 0.2)', shadow: 'rgba(161, 161, 170, 0.4)' },
  'vendido': { bg: 'rgba(161, 161, 170, 0.1)', color: '#a1a1aa', border: 'rgba(161, 161, 170, 0.2)', shadow: 'rgba(161, 161, 170, 0.4)' },
  'Reservado': { bg: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.2)', shadow: 'rgba(56, 189, 248, 0.4)' },
  'reservado': { bg: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.2)', shadow: 'rgba(56, 189, 248, 0.4)' },

  // Oficina status
  'Na Oficina': { bg: 'rgba(251, 146, 60, 0.1)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.2)', shadow: 'rgba(251, 146, 60, 0.4)' },
  'na_oficina': { bg: 'rgba(251, 146, 60, 0.1)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.2)', shadow: 'rgba(251, 146, 60, 0.4)' },
  'Diagnóstico': { bg: 'rgba(251, 146, 60, 0.1)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.2)', shadow: 'rgba(251, 146, 60, 0.4)' },
  'diagnostico': { bg: 'rgba(251, 146, 60, 0.1)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.2)', shadow: 'rgba(251, 146, 60, 0.4)' },
  'Aguardando Peça': { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.2)', shadow: 'rgba(168, 85, 247, 0.4)' },
  'aguardando_peca': { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.2)', shadow: 'rgba(168, 85, 247, 0.4)' },
  'Em Andamento': { bg: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', border: 'rgba(96, 165, 250, 0.2)', shadow: 'rgba(96, 165, 250, 0.4)' },
  'em_andamento': { bg: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', border: 'rgba(96, 165, 250, 0.2)', shadow: 'rgba(96, 165, 250, 0.4)' },
  'Pronto': { bg: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: 'rgba(52, 211, 153, 0.2)', shadow: 'rgba(52, 211, 153, 0.4)' },
  'pronto': { bg: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: 'rgba(52, 211, 153, 0.2)', shadow: 'rgba(52, 211, 153, 0.4)' },
  'Entregue': { bg: 'rgba(161, 161, 170, 0.1)', color: '#a1a1aa', border: 'rgba(161, 161, 170, 0.2)', shadow: 'rgba(161, 161, 170, 0.4)' },
  'entregue': { bg: 'rgba(161, 161, 170, 0.1)', color: '#a1a1aa', border: 'rgba(161, 161, 170, 0.2)', shadow: 'rgba(161, 161, 170, 0.4)' },
}

interface BadgeProps {
  status: string
  className?: string
}

export default function Badge({ status, className }: BadgeProps) {
  const style = STATUS_STYLES[status] ?? {
    bg: 'rgba(161, 161, 170, 0.1)',
    color: '#a1a1aa',
    border: 'rgba(161, 161, 170, 0.2)',
    shadow: 'rgba(161, 161, 170, 0.4)'
  }

  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border', className)}
      style={{
        background: style.bg,
        color: style.color,
        borderColor: style.border,
        boxShadow: `0 0 10px ${style.shadow} inset`
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ background: style.color, boxShadow: `0 0 6px ${style.color}` }}
      />
      {status}
    </span>
  )
}
