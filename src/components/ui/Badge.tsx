import { cn } from '../../lib/utils'

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Disponível': { bg: '#D1FAE5', color: '#065F46' },
  'disponivel': { bg: '#D1FAE5', color: '#065F46' },
  'Vendido': { bg: '#F3F4F6', color: '#6B7280' },
  'vendido': { bg: '#F3F4F6', color: '#6B7280' },
  'Reservado': { bg: '#DBEAFE', color: '#1E40AF' },
  'reservado': { bg: '#DBEAFE', color: '#1E40AF' },
  'Na Oficina': { bg: '#FEF3C7', color: '#92400E' },
  'na_oficina': { bg: '#FEF3C7', color: '#92400E' },
  'Pronto': { bg: '#D1FAE5', color: '#065F46' },
  'pronto': { bg: '#D1FAE5', color: '#065F46' },
  'Diagnóstico': { bg: '#FEF3C7', color: '#92400E' },
  'diagnostico': { bg: '#FEF3C7', color: '#92400E' },
  'Aguardando Peça': { bg: '#EDE9FE', color: '#5B21B6' },
  'aguardando_peca': { bg: '#EDE9FE', color: '#5B21B6' },
  'Em Andamento': { bg: '#DBEAFE', color: '#1E40AF' },
  'em_andamento': { bg: '#DBEAFE', color: '#1E40AF' },
  'Entregue': { bg: '#F3F4F6', color: '#6B7280' },
  'entregue': { bg: '#F3F4F6', color: '#6B7280' },
}

interface BadgeProps {
  status: string
  className?: string
}

export default function Badge({ status, className }: BadgeProps) {
  const style = STATUS_STYLES[status] ?? { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold', className)}
      style={{ background: style.bg, color: style.color }}
    >
      {status}
    </span>
  )
}
