import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Cpu, AlertCircle, RefreshCw } from 'lucide-react'

function Usage() {
  const [usage, setUsage] = useState({ totalTokens: 0, sessions: [] })
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const mountedRef = useRef(true)

  const fetchUsage = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    
    try {
      const res = await fetch('/api/usage')
      const data = await res.json()
      
      if (mountedRef.current) {
        setUsage(data)
        if (initialLoading) setInitialLoading(false)
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err)
    } finally {
      if (mountedRef.current) setRefreshing(false)
    }
  }, [initialLoading])

  useEffect(() => {
    mountedRef.current = true
    fetchUsage()
    
    const interval = setInterval(() => fetchUsage(true), 30000)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [fetchUsage])

  // Only show skeleton on first load
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--rar-accent-dim)] flex items-center justify-center">
            <Cpu className="text-[var(--rar-accent)]" size={24} />
          </div>
          <div>
            <h1 className="page-title">Token Usage</h1>
            <p className="page-subtitle">{usage.totalTokens?.toLocaleString()} total tokens</p>
          </div>
        </div>
        
        <button 
          onClick={() => fetchUsage()} 
          disabled={refreshing}
          className="btn btn-secondary p-2.5"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="divider" />

      {usage.sessions?.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Cpu size={28} />
          </div>
          <h3 className="text-lg font-medium mb-1">No session data</h3>
          <p className="text-sm text-[var(--rar-text-muted)]">Start a session to see usage</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {usage.sessions.map((session, idx) => (
            <div key={idx} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-mono text-sm text-[var(--rar-accent)] truncate">
                    {session.key}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge-neutral">{session.model}</span>
                    <span className="text-xs text-[var(--rar-text-muted)]">
                      {session.tokens?.toLocaleString()} tokens
                    </span>
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold">
                    {session.usagePercent?.toFixed(1)}%
                  </div>
                  <div className="text-xs text-[var(--rar-text-muted)]">
                    of {session.contextTokens?.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="h-2 bg-[var(--rar-surface-hover)] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      session.usagePercent > 80 ? 'bg-red-500' : 
                      session.usagePercent > 50 ? 'bg-yellow-500' : 'bg-[var(--rar-accent)]'
                    }`}
                    style={{ width: `${Math.min(session.usagePercent || 0, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-3 text-xs text-[var(--rar-text-muted)]">
                <span>In: {session.inputTokens?.toLocaleString()}</span>
                <span>Out: {session.outputTokens?.toLocaleString()}</span>
              </div>
              
              {session.usagePercent > 80 && (
                <div className="flex items-center gap-2 mt-3 text-xs text-red-400">
                  <AlertCircle size={14} />
                  High context usage - consider starting a new session
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Usage
