import { NavLink, useRoutes } from 'react-router-dom'
import routes from './routes.jsx'
import DeviceNick from '../features/devices/index.jsx'

export default function App() {
  const element = useRoutes(routes)
  return (
    <div className="app-shell">
      <header className="app-header glass">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">◍</span>
          <span className="brand-name">drop</span>
          <span className="brand-sub">send anywhere</span>
        </div>
        <nav className="tabs" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Send
          </NavLink>
          <NavLink to="/receive" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Receive
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            History
          </NavLink>
          <NavLink to="/storage" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Storage
          </NavLink>
        </nav>
        <DeviceNick compact />
      </header>
      <main className="app-main">{element}</main>
      <footer className="app-footer">
        <span>No cables. No login. Files expire automatically.</span>
      </footer>
    </div>
  )
}
