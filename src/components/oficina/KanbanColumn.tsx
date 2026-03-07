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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 4 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <span style={{ fontWeight: 800, fontSize: 15, color: '#4A443F' }}>{title}</span>
        <span style={{
          background: '#F0EBE3', color: '#9A948E', fontSize: 11, fontWeight: 700,
          borderRadius: 20, padding: '2px 8px', marginLeft: 2,
        }}>
          {count}
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          background: dragOver ? '#EEF3E5' : '#F5F1EB',
          borderRadius: 14,
          padding: '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 200,
          border: dragOver ? '2px dashed #5D6D3E' : '2px solid transparent',
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
            <div style={{ width: 22, height: 22, border: '3px solid #EEF3E5', borderTopColor: '#5D6D3E', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '32px 0', color: '#C0BAB2' }}>
            <span style={{ fontSize: 13 }}>{dragOver ? 'Soltar aqui' : 'Nenhuma OS aqui'}</span>
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
