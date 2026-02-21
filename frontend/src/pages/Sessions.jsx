import { useState, useEffect } from 'react'
import { Activity, Cpu, Clock } from 'lucide-react'

function Sessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(data => {
        // Parse sessions.json format
        const sessionList = data.sessions || []
        setSessions(sessionList)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load sessions:', err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Activity className="text-rar-accent" />
        Active Sessions
      </h1>

      {sessions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No active sessions</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session, idx) => (
            <div key={idx} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-lg">{session.key || session.id || `Session ${idx + 1}`}</div>
                  <div className="text-sm text-gray-400 mt-1">{session.kind || 'unknown'}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm">
                    <Cpu size={14} />
                    {session.model || 'unknown'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <Clock size={14} />
                    {session.age || 'unknown'}
                  </div>
                </div>
              </div>
              
              {session.tokens && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Context Window</span>
                    <span>{session.tokens}</span>
                  </div>
                  <div className="w-full bg-rar-700 rounded-full h-2">
                    <div 
                      className="bg-rar-accent h-2 rounded-full transition-all"
                      style={{ width: session.ctxPercent ? `${session.ctxPercent}%` : '0%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Sessions