import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Activity, Cpu, Clock, Terminal, Wifi, WifiOff, RefreshCw } from 'lucide-react'

function Sessions() {
  const [sessions, setSessions] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const mountedRef = useRef(true)

  const fetchSessions = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    
    try {
      const res = await fetch('/api/sessions')
      const data = await res.json()
      
      if (mountedRef.current) {
        setSessions(data.sessions || [])
        if (initialLoading) setInitialLoading(false)
      }
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      if (mountedRef.current) setRefreshing(false)
    }
  }, [initialLoading])

  useEffect(() => {
    mountedRef.current = true
    fetchSessions()
    
    const interval = setInterval(() => fetchSessions(true), 30000)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [fetchSessions])

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

  if (initialLoading) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--rar-accent-dim)] flex items-center justify-center">
            <Activity className="text-[var(--rar-accent)]" size={24} />
          </div>
          <div>
            <h1 className="page-title">Sessions</h1>
            <p className="page-subtitle">{sessions.length} active session{sessions.length !== 1 && 's'}</p>
          </div>
        </div>
        
        <button 
          onClick={() => fetchSessions()} 
          disabled={refreshing}
          className="btn btn-secondary p-2.5"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="divider" />

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Terminal size={32} />
          </div>
          <h3 className="text-lg font-medium text-[var(--rar-text)] mb-1">No active sessions</h3>
          <p className="text-gray-400">No active sessions</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map((session, idx) => (
            <div key={idx} className="card p-4 group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--rar-surface-hover)] flex items-center justify-center shrink-0">
                  <Terminal size={18} className="text-[var(--rar-text-muted)]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-sm text-[var(--rar-accent)] truncate">
                        {session.key || session.id || `session-${idx}`}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {getStatusBadge(session.status)}
                        <span className="badge-neutral">
                          <Cpu size={10} /> {session.model || 'unknown'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-[var(--rar-text-muted)] shrink-0">
                      <Clock size={12} />
                      {session.age || 'now'}
                    </div>
                  </div>
                  
                  {session.tokens && (
                    <div className="mt-3 pt-3 border-t border-[var(--rar-border)]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--rar-text-muted)]">Context</span>
                        <span className="font-mono">{session.tokens?.toLocaleString()}</span>
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
