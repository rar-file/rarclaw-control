import React, { useState } from 'react'
import { Zap, Clock, Brain, Activity, GitBranch, Send, CheckCircle, AlertCircle } from 'lucide-react'

const QUICK_ACTIONS = [
  { id: 'remind', label: 'Remind me...', icon: Clock, desc: 'Set a reminder', color: 'blue' },
  { id: 'summarize', label: 'Summarize', icon: Brain, desc: 'Summarize URL or text', color: 'purple' },
  { id: 'check', label: 'Check on...', icon: Activity, desc: 'Check something', color: 'green' },
  { id: 'deploy', label: 'Deploy', icon: GitBranch, desc: 'Git commit & push', color: 'orange' },
]

function QuickActions() {
  const [activeAction, setActiveAction] = useState(null)
  const [input, setInput] = useState('')
  const [minutes, setMinutes] = useState(5)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const executeAction = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      let res, data
      
      switch (activeAction) {
        case 'remind':
          res = await fetch('/api/quick/remind', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ minutes, message: input })
          })
          break
        case 'summarize':
          res = await fetch('/api/quick/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: input.startsWith('http') ? input : undefined, text: input })
          })
          break
        case 'check':
          res = await fetch('/api/quick/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: input })
          })
          break
        case 'deploy':
          res = await fetch('/api/quick/deploy', { method: 'POST' })
          break
      }
      
      data = await res.json()
      
      if (res.ok) {
        setResult({ type: 'success', text: data.message || data.status || 'Done!' })
        setInput('')
      } else {
        setResult({ type: 'error', text: data.error || 'Failed' })
      }
    } catch (err) {
      setResult({ type: 'error', text: err.message })
    }
    
    setLoading(false)
  }

  const renderActionForm = () => {
    switch (activeAction) {
      case 'remind':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Remind me in...</label>
              <div className="flex gap-2">
                {[5, 15, 30, 60].map(m => (
                  <button
                    key={m}
                    onClick={() => setMinutes(m)}
                    className={`btn flex-1 ${minutes === m ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="What should I remind you about?"
                className="input"
              />
            </div>
          </div>
        )
      
      case 'summarize':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">URL or Text</label>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Paste a URL or text to summarize..."
                className="input min-h-[120px] resize-none"
                rows={4}
              />
            </div>
          </div>
        )
      
      case 'check':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">What to check?</label>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="e.g., server status, crypto prices, news..."
                className="input"
              />
            </div>
          </div>
        )
      
      case 'deploy':
        return (
          <div className="space-y-4">
            <p className="text-sm text-[var(--rar-text-muted)]">This will:</p>
            <ul className="text-sm text-[var(--rar-text-muted)] list-disc list-inside space-y-1">
              <li>Add all changes to git</li>
              <li>Commit with timestamp</li>
              <li>Push to origin</li>
            </ul>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--rar-accent-dim)] flex items-center justify-center">
          <Zap className="text-[var(--rar-accent)]" size={24} />
        </div>
        <div>
          <h1 className="page-title">Quick Actions</h1>
          <p className="page-subtitle">One-click common tasks</p>
        </div>
      </div>

      <div className="divider" />

      {result && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          result.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {result.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {result.text}
        </div>
      )}

      {!activeAction ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => setActiveAction(action.id)}
              className="card p-4 text-left hover:border-[var(--rar-accent)] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--rar-surface-hover)] flex items-center justify-center">
                  <action.icon size={20} className="text-[var(--rar-accent)]" />
                </div>
                <div>
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-[var(--rar-text-muted)]">{action.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {(() => {
                const action = QUICK_ACTIONS.find(a => a.id === activeAction)
                return <action.icon size={20} className="text-[var(--rar-accent)]" />
              })()}
              <span className="font-medium">{QUICK_ACTIONS.find(a => a.id === activeAction)?.label}</span>
            </div>
            <button 
              onClick={() => { setActiveAction(null); setResult(null); }}
              className="btn btn-ghost p-1 text-sm"
            >
              Cancel
            </button>
          </div>
          
          {renderActionForm()}
          
          <button
            onClick={executeAction}
            disabled={loading || (activeAction !== 'deploy' && !input.trim())}
            className="btn btn-primary w-full mt-4"
          >
            {loading ? 'Working...' : (
              <>
                <Send size={16} /> Execute
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default QuickActions
