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
  accentColor = '#3B82F6',
  icon,
  sub,
}: KpiCardProps) {
  return (
    <div
      className="bg-white flex flex-col justify-between"
      style={{
        borderLeft: `4px solid ${accentColor}`,
        border: `1px solid #E2E8F0`,
        borderLeftWidth: '4px',
        borderLeftColor: accentColor,
        borderRadius: '6px',
        padding: '16px 20px',
      }}
    >
      <div className="flex items-start justify-between">
        <span className="label-uppercase">{label}</span>
        {icon && <span style={{ color: accentColor }}>{icon}</span>}
      </div>
      <div className="mt-2">
        <span
          style={{
            fontFamily: 'Quicksand, sans-serif',
            fontWeight: 700,
            fontSize: '26px',
            color: '#0F172A',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {sub && (
          <p style={{ color: '#64748B', fontSize: '12px', marginTop: '4px' }}>{sub}</p>
        )}
      </div>
    </div>
  )
}
