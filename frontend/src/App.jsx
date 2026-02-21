import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { 
  Activity, 
  Brain, 
  Clock, 
  MessageSquare, 
  Globe, 
  Github,
  Menu,
  X,
  Terminal,
  ChevronRight
} from 'lucide-react'
import Sessions from './pages/Sessions'
import Memory from './pages/Memory'
import Cron from './pages/Cron'
import Channels from './pages/Channels'
import Browser from './pages/Browser'
import GitHub from './pages/GitHub'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [status, setStatus] = useState({ status: 'connecting', gateway: '' })
  const location = useLocation()

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => setStatus(data))
      .catch(() => setStatus({ status: 'error', gateway: '' }))
    
    // Close sidebar on route change (mobile)
    setSidebarOpen(false)
  }, [location.pathname])

  const navItems = [
    { path: '/', icon: Activity, label: 'Sessions' },
    { path: '/memory', icon: Brain, label: 'Memory' },
    { path: '/cron', icon: Clock, label: 'Cron' },
    { path: '/channels', icon: MessageSquare, label: 'Channels' },
    { path: '/browser', icon: Globe, label: 'Browser' },
    { path: '/github', icon: Github, label: 'GitHub' },
  ]

  const currentPage = navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'

  return (
    <div className="flex h-screen bg-[var(--rar-bg)] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-[var(--rar-surface)] border-r border-[var(--rar-border)]">
        {/* Logo */}
        <div className="p-4 border-b border-[var(--rar-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--rar-accent)]/10 flex items-center justify-center">
              <Terminal size={20} className="text-[var(--rar-accent)]" />
            </div>
            <div>
              <div className="font-semibold text-[var(--rar-text)]">Rarclaw</div>
              <div className="text-xs text-[var(--rar-text-muted)]">Control Center</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {location.pathname === item.path && (
                <ChevronRight size={14} className="ml-auto text-[var(--rar-accent)]" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Status */}
        <div className="p-4 border-t border-[var(--rar-border)]">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              status.status === 'ok' ? 'bg-[var(--rar-success)]' : 'bg-[var(--rar-error)]'
            } ${status.status === 'ok' ? 'animate-pulse' : ''}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--rar-text)]">
                {status.status === 'ok' ? 'Connected' : 'Disconnected'}
              </div>
              <div className="text-xs text-[var(--rar-text-muted)] truncate font-mono">
                {status.gateway?.replace('ws://', '') || '—'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--rar-surface)]/95 backdrop-blur border-b border-[var(--rar-border)]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="btn-ghost p-2 -ml-2"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-[var(--rar-accent)]" />
              <span className="font-semibold">{currentPage}</span>
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full ${
            status.status === 'ok' ? 'bg-[var(--rar-success)]' : 'bg-[var(--rar-error)]'
          }`} />
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      <div className={`md:hidden fixed inset-0 z-[60] transition-visibility duration-300 ${
        sidebarOpen ? 'visible' : 'invisible'
      }`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        
        {/* Drawer */}
        <aside className={`absolute left-0 top-0 bottom-0 w-72 bg-[var(--rar-surface)] border-r border-[var(--rar-border)] transform transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Drawer Header */}
          <div className="p-4 border-b border-[var(--rar-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--rar-accent)]/10 flex items-center justify-center">
                <Terminal size={20} className="text-[var(--rar-accent)]" />
              </div>
              <div>
                <div className="font-semibold">Rarclaw</div>
                <div className="text-xs text-[var(--rar-text-muted)]">Control Center</div>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="btn-ghost p-2"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Nav */}
          <nav className="p-3 space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {location.pathname === item.path && (
                  <ChevronRight size={14} className="ml-auto text-[var(--rar-accent)]" />
                )}
              </NavLink>
            ))}
          </nav>

          {/* Drawer Status */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--rar-border)] bg-[var(--rar-surface)]">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                status.status === 'ok' ? 'bg-[var(--rar-success)]' : 'bg-[var(--rar-error)]'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {status.status === 'ok' ? 'Connected' : 'Disconnected'}
                </div>
                <div className="text-xs text-[var(--rar-text-muted)] truncate font-mono">
                  {status.gateway?.replace('ws://', '') || '—'}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="p-4 md:p-6 max-w-7xl mx-auto animate-slide-in">
          <Routes>
            <Route path="/" element={<Sessions />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/cron" element={<Cron />} />
            <Route path="/channels" element={<Channels />} />
            <Route path="/browser" element={<Browser />} />
            <Route path="/github" element={<GitHub />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App