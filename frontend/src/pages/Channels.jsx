import React, { useState, useEffect } from 'react'
import { MessageSquare, Check, X, Wifi } from 'lucide-react'

function Channels() {
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/channels')
      .then(r => r.json())
      .then(data => {
        setChannels(data.channels || [])
        setLoading(false)
      })
      .catch(() => {
        setChannels([])
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
            <MessageSquare className="text-[var(--rar-accent)]" size={24} />
          </div>
          <div>
            <h1 className="page-title">Channels</h1>
            <p className="page-subtitle">{channels.length} connected</p>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Channels Grid */}
      {channels.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Wifi size={28} />
          </div>
          <h3 className="text-lg font-medium text-[var(--rar-text)] mb-1">No channels configured</h3>
          <p className="text-sm text-[var(--rar-text-muted)]">Add channels in OpenClaw config</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel, idx) => (
            <div key={idx} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--rar-surface-hover)] flex items-center justify-center">
                    <MessageSquare size={18} className="text-[var(--rar-text-muted)]" />
                  </div>
                  <div>
                    <div className="font-medium capitalize">{channel.name}</div>
                    <div className="flex items-center gap-1.5 text-xs">
                      {channel.status === 'connected' ? (
                        <>
                          <Check size={10} className="text-green-500" />
                          <span className="text-green-400">Connected</span>
                        </>
                      ) : (
                        <>
                          <X size={10} className="text-red-500" />
                          <span className="text-red-400">{channel.status}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Channels