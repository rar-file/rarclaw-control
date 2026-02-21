import { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { 
  Activity, 
  Brain, 
  Clock, 
  MessageSquare, 
  Globe, 
  Github,
  Menu,
  X
} from 'lucide-react'
import Sessions from './pages/Sessions'
import Memory from './pages/Memory'
import Cron from './pages/Cron'
import Channels from './pages/Channels'
import Browser from './pages/Browser'
import GitHub from './pages/GitHub'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [status, setStatus] = useState({ status: 'connecting', gateway: '' })

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => setStatus(data))
      .catch(() => setStatus({ status: 'error', gateway: '' }))
  }, [])

  const navItems = [
    { path: '/', icon: Activity, label: 'Sessions' },
    { path: '/memory', icon: Brain, label: 'Memory' },
    { path: '/cron', icon: Clock, label: 'Cron' },
    { path: '/channels', icon: MessageSquare, label: 'Channels' },
    { path: '/browser', icon: Globe, label: 'Browser' },
    { path: '/github', icon: Github, label: 'GitHub' },
  ]

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-rar-800 border-r border-rar-700 transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-rar-700">
          {sidebarOpen && <span className="font-bold text-rar-accent">Rarclaw</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-rar-700 rounded">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="flex-1 p-2">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 p-3 rounded-lg transition ${
                  isActive ? 'bg-rar-accent text-white' : 'hover:bg-rar-700'
                }`
              }
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-rar-700 text-xs text-gray-400">
          {sidebarOpen && (
            <div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
                {status.status}
              </div>
              <div className="mt-1 truncate">{status.gateway}</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        <Routes>
          <Route path="/" element={<Sessions />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="/cron" element={<Cron />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/browser" element={<Browser />} />
          <Route path="/github" element={<GitHub />} />
        </Routes>
      </main>
    </div>
  )
}

export default App