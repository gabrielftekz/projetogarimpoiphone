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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div
        className="w-full relative flex flex-col bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_24px_50px_rgba(0,0,0,0.8)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.03] before:to-transparent before:rounded-2xl before:pointer-events-none"
        style={{ maxWidth: width, maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="m-0 text-lg font-bold text-white tracking-wide">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  )
}
