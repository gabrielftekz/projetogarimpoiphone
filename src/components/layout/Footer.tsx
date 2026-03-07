export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #F0EBE3', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 12, color: '#C5BFB9' }}>© 2026 TEKZ</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#16A34A' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'pulse-dot 3s infinite', display: 'inline-block' }} />
            Tudo certo com o sistema
          </span>
          <a href="#" style={{ fontSize: 12, color: '#9A948E', textDecoration: 'none', fontWeight: 600 }}>Suporte</a>
        </div>
      </div>
    </footer>
  )
}
