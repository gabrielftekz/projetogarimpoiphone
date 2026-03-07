import { useEffect, type ReactNode } from 'react'
import Icon from './Icon'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: string
}

export default function Modal({ open, onClose, title, children, width = '520px' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(15,23,42,0.45)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          borderRadius: 20,
          border: '1px solid #EDE8E0',
          boxShadow: '0 24px 48px rgba(15,23,42,0.14)',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid #F0EBE3',
          }}
        >
          <h2 style={{
            margin: 0, fontSize: 18, fontWeight: 700,
            fontFamily: 'Quicksand, sans-serif', color: '#4A443F',
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: '#F5F0EA', border: 'none', color: '#9A948E',
              padding: 6, borderRadius: 8, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#EDE8E0' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F5F0EA' }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', scrollbarWidth: 'thin' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
