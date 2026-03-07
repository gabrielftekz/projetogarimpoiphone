interface IconProps {
  name: string
  size?: number
  style?: React.CSSProperties
}

export default function Icon({ name, size = 20, style }: IconProps) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: size, lineHeight: 1, ...style }}
    >
      {name}
    </span>
  )
}
