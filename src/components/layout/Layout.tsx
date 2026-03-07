import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FCF9F5' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}
