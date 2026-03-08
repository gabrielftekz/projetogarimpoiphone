import { useState } from 'react'
import KanbanCard from './KanbanCard'
import type { OrdemServico, OSStatus } from '../../types'

interface KanbanColumnProps {
  title: string
  dotColor: string
  status: OSStatus
  orders: OrdemServico[]
  onEdit: (os: OrdemServico) => void
  onAdvance: (id: string, status: OSStatus) => void
  onDragStart: (e: React.DragEvent, os: OrdemServico) => void
  onDrop: (status: OSStatus) => void
  onDelete: (id: string) => void
  loading?: boolean
}

export default function KanbanColumn({ title, dotColor, status, orders, onEdit, onAdvance, onDragStart, onDrop, onDelete, loading }: KanbanColumnProps) {
  const [dragOver, setDragOver] = useState(false)
  const count = orders.length

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    onDrop(status)
  }

  return (
    <div className="flex flex-col gap-4 min-w-0 flex-1">
      <div className="flex items-center gap-3 pb-1 border-b border-white/5">
        <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ background: dotColor, color: dotColor }} />
        <span className="font-bold text-sm text-white uppercase tracking-wider">{title}</span>
        <span className="ml-auto bg-white/10 text-white text-[10px] font-bold rounded-full px-2 py-0.5 border border-white/10">
          {count}
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col gap-4 min-h-[250px] rounded-2xl p-3 transition-colors duration-300 border-2 ${dragOver ? 'border-teal-500/50 bg-teal-500/5' : 'border-dashed border-white/10 bg-white/[0.01]'
          }`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className={`w-6 h-6 border-2 border-white/10 border-t-current rounded-full animate-spin`} style={{ color: dotColor }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-zinc-500">
            <span className="text-xs font-medium tracking-wide">{dragOver ? 'Soltar OS aqui' : 'Vazio'}</span>
          </div>
        ) : (
          orders.map((os) => (
            <KanbanCard key={os.id} os={os} onEdit={onEdit} onAdvance={onAdvance} onDragStart={onDragStart} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  )
}
