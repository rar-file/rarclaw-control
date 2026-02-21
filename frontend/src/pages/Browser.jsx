import React, { useState, useEffect } from 'react'
import { Globe, Monitor, Camera, MousePointer, ExternalLink } from 'lucide-react'

function Browser() {
  const [status, setStatus] = useState(null)
  const [tabs, setTabs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/browser/status').then(r => r.json()),
      fetch('/api/browser/tabs').then(r => r.json())
    ]).then(([statusData, tabsData]) => {
      setStatus(statusData)
      setTabs(tabsData.tabs || [])
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--rar-accent)]/10 flex items-center justify-center">
            <Globe className="text-[var(--rar-accent)]" size={24} />
          </div>
          <div>
            <h1 className="page-title">Browser</h1>
            <p className="page-subtitle">{status?.status || 'Unknown'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Camera size={16} />
            <span className="hidden sm:inline">Screenshot</span>
          </button>
        </div>
      </div>

      <div className="divider" />

      {/* Status Card */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[var(--rar-surface-hover)] flex items-center justify-center">
            <Monitor size={28} className="text-[var(--rar-text-muted)]" />
          </div>
          <div>
            <div className="text-sm text-[var(--rar-text-muted)]">Status</div>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${
                status?.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <span className="font-medium">{status?.status === 'available' ? 'Ready' : 'Limited'}</span>
            </div>
            {status?.version && (
              <div className="text-xs text-[var(--rar-text-muted)] mt-1">
                {status.version}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="p-3 border-b border-[var(--rar-border)] font-medium">
          Tabs ({tabs.length})
        </div>
        
        {tabs.length === 0 ? (
          <div className="p-8 text-center">
            <MousePointer size={32} className="mx-auto mb-3 text-[var(--rar-text-muted)]" />
            <p className="text-sm text-[var(--rar-text-muted)]">No active tabs</p>
            <p className="text-xs text-[var(--rar-text-muted)] mt-1">Browser control requires OpenClaw extension</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--rar-border)]">
            {tabs.map((tab, idx) => (
              <div key={idx} className="p-3 flex items-center gap-3">
                <img src={tab.favicon} alt="" className="w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{tab.title}</div>
                  <div className="text-xs text-[var(--rar-text-muted)] truncate">{tab.url}</div>
                </div>
                <a 
                  href={tab.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-ghost p-1"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Browser