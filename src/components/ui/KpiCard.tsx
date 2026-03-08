import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value: string | number
  accentColor?: string
  icon?: ReactNode
  sub?: string
}

export default function KpiCard({
  label,
  value,
  accentColor = '#14b8a6', // Teal default
  icon,
  sub,
}: KpiCardProps) {
  // Use hex conversion for rgba glows
  const getGlow = (color: string) => {
    return `0 0 20px ${color}30, 0 0 0 1px ${color}40 inset`
  }

  return (
    <div
      className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group"
      style={{
        boxShadow: `0 8px 30px rgba(0,0,0,0.3)`
      }}
    >
      {/* Top Accent Line */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />

      {/* Background Glow Effect on Hover */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
        style={{ background: accentColor }}
      />

      <div className="flex items-start justify-between relative z-10">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
        {icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              color: accentColor,
              background: `color-mix(in srgb, ${accentColor} 15%, transparent)`
            }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-4 relative z-10">
        <span className="font-bold text-3xl text-white tracking-tight">
          {value}
        </span>
        {sub && (
          <p className="text-sm mt-1" style={{ color: accentColor }}>{sub}</p>
        )}
      </div>
    </div>
  )
}
