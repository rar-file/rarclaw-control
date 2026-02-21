import React, { useState, useEffect } from 'react'
import {
  Activity, Brain, Clock, MessageSquare, Globe, Github, Zap,
  Plus, Terminal, Cpu, Wallet, GitBranch, Send, Camera,
  ChevronRight, RefreshCw, AlertCircle, CheckCircle, X, Play, Pause
} from 'lucide-react'
import Sessions from './pages/Sessions'
import Memory from './pages/Memory'
import Channels from './pages/Channels'
import Browser from './pages/Browser'
import GitHub from './pages/GitHub'
import Usage from './pages/Usage'
import QuickActions from './pages/QuickActions'
import Files from './pages/Files'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'sessions', label: 'Sessions', icon: Terminal },
  { id: 'usage', label: 'Token Usage', icon: Cpu },
  { id: 'quick', label: 'Quick Actions', icon: Zap },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'files', label: 'Files', icon: Globe },
  { id: 'channels', label: 'Channels', icon: MessageSquare },
  { id: 'github', label: 'GitHub', icon: Github },
]

function App() {
  const [currentPage, setCurrentPage] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [status, setStatus] = useState({ status: 'connecting', gateway: '' })
  const [stats, setStats] = useState({ sessions: 0, tokens: 0, jobs: 0, subagents: 0 })

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => setStatus(data))
      .catch(() => setStatus({ status: 'error', gateway: '' }))

    // Load stats
    Promise.all([
      fetch('/api/sessions').then(r => r.json()),
      fetch('/api/usage').then(r => r.json())
    ]).then(([sessions, usage]) => {
      setStats({
        sessions: sessions.sessions?.length || 0,
        tokens: usage.totalTokens || 0,
        jobs: 0,
        subagents: 0
      })
    })
  }, [])

  const renderPage = () => {
    switch (currentPage) {
      case 'overview': return <Overview stats={stats} status={status} onNavigate={setCurrentPage} />
      case 'sessions': return <Sessions />
      case 'usage': return <Usage />
      case 'quick': return <QuickActions />
      case 'memory': return <Memory />
      case 'files': return <Files />
      case 'channels': return <Channels />
      case 'github': return <GitHub />
      default: return <Overview stats={stats} status={status} onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="flex h-screen bg-[var(--rar-bg)] text-[var(--rar-text)] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-[var(--rar-surface)] border-r border-[var(--rar-border)]">
        <div className="p-4 border-b border-[var(--rar-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--rar-accent)]/10 flex items-center justify-center">
              <Activity size={20} className="text-[var(--rar-accent)]" />
            </div>
            <div>
              <div className="font-bold">Rarclaw</div>
              <div className="text-xs text-[var(--rar-text-muted)]">Control Center</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`nav-item w-full ${currentPage === item.id ? 'active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {currentPage === item.id && <ChevronRight size={14} className="ml-auto text-[var(--rar-accent)]" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--rar-border)]">
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${status.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={status.status === 'ok' ? 'text-green-400' : 'text-red-400'}>
              {status.status === 'ok' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--rar-surface)]/95 backdrop-blur border-b border-[var(--rar-border)]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="btn btn-ghost p-2 -ml-2">
              <Activity size={20} />
            </button>
            <span className="font-semibold">{NAV_ITEMS.find(i => i.id === currentPage)?.label || 'Dashboard'}</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${status.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[var(--rar-surface)] border-r border-[var(--rar-border)]">
            <div className="p-4 border-b border-[var(--rar-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--rar-accent)]/10 flex items-center justify-center">
                  <Activity size={20} className="text-[var(--rar-accent)]" />
                </div>
                <div>
                  <div className="font-bold">Rarclaw</div>
                  <div className="text-xs text-[var(--rar-text-muted)]">Control Center</div>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="btn btn-ghost p-2">
                <X size={20} />
              </button>
            </div>

            <nav className="p-3 space-y-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
                  className={`nav-item w-full ${currentPage === item.id ? 'active' : ''}`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="p-4 md:p-6 max-w-7xl mx-auto animate-slide-in">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

// Overview Dashboard
function Overview({ stats, status, onNavigate }) {
  const cards = [
    { label: 'Active Sessions', value: stats.sessions, icon: Terminal, color: 'blue', page: 'sessions' },
    { label: 'Tokens Used', value: stats.tokens.toLocaleString(), icon: Cpu, color: 'orange', page: 'usage' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-[var(--rar-text-muted)]">Overview of your OpenClaw setup</p>
        </div>
        <button onClick={() => onNavigate('quick')} className="btn btn-primary">
          <Zap size={16} />
          <span className="hidden sm:inline">Quick Actions</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <button
            key={card.label}
            onClick={() => onNavigate(card.page)}
            className="card p-4 text-left hover:border-[var(--rar-accent)] transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <card.icon size={20} className="text-[var(--rar-accent)]" />
              <ChevronRight size={16} className="text-[var(--rar-text-muted)]" />
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs text-[var(--rar-text-muted)]">{card.label}</div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-medium mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onNavigate('quick')} className="btn btn-secondary justify-start">
              <Clock size={16} />
              Remind me...
            </button>
            <button onClick={() => onNavigate('quick')} className="btn btn-secondary justify-start">
              <Brain size={16} />
              Summarize
            </button>
            <button onClick={() => onNavigate('quick')} className="btn btn-secondary justify-start">
              <Activity size={16} />
              Check on...
            </button>
            <button onClick={() => onNavigate('quick')} className="btn btn-secondary justify-start">
              <GitBranch size={16} />
              Deploy
            </button>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-medium mb-3">System Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--rar-text-muted)]">Gateway</span>
              <span className={status.status === 'ok' ? 'text-green-400' : 'text-red-400'}>
                {status.status === 'ok' ? 'Connected' : 'Error'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--rar-text-muted)]">URL</span>
              <span className="font-mono text-xs">{status.gateway}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
