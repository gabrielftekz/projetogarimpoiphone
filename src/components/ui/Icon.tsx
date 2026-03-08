interface IconProps {
  name: string
  size?: number
  style?: React.CSSProperties
  className?: string
}

export default function Icon({ name, size = 20, style, className = "" }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, lineHeight: 1, ...style }}
    >
      {name}
    </span>
  )
}
