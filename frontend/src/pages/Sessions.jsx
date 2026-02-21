import React, { useState, useEffect } from 'react'
import { Activity, Cpu, Clock, Zap, Terminal, Users, Wifi, WifiOff } from 'lucide-react'

function Sessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(data => {
        const sessionList = data.sessions || []
        setSessions(sessionList)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load sessions:', err)
        setLoading(false)
      })
  }, [])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
      case 'ok':
        return <span className="badge-success"><Wifi size={10} /> Active</span>
      case 'error':
        return <span className="badge-error"><WifiOff size={10} /> Error</span>
      default:
        return <span className="badge-neutral">{status || 'Unknown'}</span>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl skeleton" />
          <div className="space-y-2">
            <div className="w-32 h-5 skeleton" />
            <div className="w-20 h-4 skeleton" />
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg skeleton" />
              <div className="flex-1 space-y-2">
                <div className="w-48 h-4 skeleton" />
                <div className="w-24 h-3 skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--rar-accent)]/10 flex items-center justify-center">
            <Activity className="text-[var(--rar-accent)]" size={24} />
          </div>
          <div>
            <h1 className="page-title">Sessions</h1>
            <p className="page-subtitle">{sessions.length} active session{sessions.length !== 1 && 's'}</p>
          </div>
        </div>
        
        <button className="btn-primary">
          <Zap size={16} />
          <span className="hidden sm:inline">New Session</span>
        </button>
      </div>

      <div className="divider" />

      {/* Sessions Grid */}
      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users size={28} />
          </div>
          <h3 className="text-lg font-medium text-[var(--rar-text)] mb-1">No active sessions</h3>
          <p className="text-sm text-[var(--rar-text-muted)] max-w-sm">
            Start a new session to begin interacting with OpenClaw agents.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map((session, idx) => (
            <div 
              key={idx} 
              className="card p-4 group cursor-pointer"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-[var(--rar-surface-hover)] flex items-center justify-center shrink-0">
                  <Terminal size={18} className="text-[var(--rar-text-muted)]" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-sm text-[var(--rar-accent)] truncate">
                        {session.key || session.id || `session-${idx}`}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {getStatusBadge(session.status)}
                        <span className="badge-neutral">
                          <Cpu size={10} /> {session.model || 'default'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-[var(--rar-text-muted)] shrink-0">
                      <Clock size={12} />
                      {session.age || 'now'}
                    </div>
                  </div>
                  
                  {/* Context bar */}
                  {session.tokens && (
                    <div className="mt-3 pt-3 border-t border-[var(--rar-border)]">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-[var(--rar-text-muted)]">Context Window</span>
                        <span className="font-mono text-[var(--rar-text)]">{session.tokens}</span>
                      </div>
                      <div className="h-1.5 bg-[var(--rar-surface-hover)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[var(--rar-accent)] to-orange-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(session.ctxPercent || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Sessions