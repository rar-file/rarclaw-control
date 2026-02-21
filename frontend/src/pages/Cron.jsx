import React, { useState, useEffect } from 'react'
import { 
  Clock, Plus, Play, Trash2, RefreshCw, AlertCircle, CheckCircle, 
  Pause, Power, History, Terminal, Globe, MessageSquare, Bell,
  ChevronDown, ChevronUp, Repeat, Zap, X, ArrowLeft, Check
} from 'lucide-react'

const SCHEDULE_PRESETS = [
  { label: 'Every minute', kind: 'every', everyMs: 60000 },
  { label: 'Every 5 min', kind: 'every', everyMs: 300000 },
  { label: 'Every 15 min', kind: 'every', everyMs: 900000 },
  { label: 'Every 30 min', kind: 'every', everyMs: 1800000 },
  { label: 'Every hour', kind: 'every', everyMs: 3600000 },
  { label: 'Daily 9am', kind: 'cron', expr: '0 9 * * *' },
  { label: 'Daily 6pm', kind: 'cron', expr: '0 18 * * *' },
  { label: 'Weekly Mon', kind: 'cron', expr: '0 9 * * 1' },
  { label: 'One time only', kind: 'once' },
]

const PAYLOAD_TYPES = [
  { id: 'exec', label: 'Shell', icon: Terminal, desc: 'Run commands' },
  { id: 'webhook', label: 'Webhook', icon: Globe, desc: 'Call URL' },
  { id: 'systemEvent', label: 'System', icon: Bell, desc: 'Inject to session' },
  { id: 'agentTurn', label: 'Agent', icon: MessageSquare, desc: 'Spawn agent' },
]

function Cron() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [expandedJob, setExpandedJob] = useState(null)
  const [message, setMessage] = useState(null)
  
  // Step: 'name' | 'schedule' | 'type' | 'command' | 'delivery' | 'review'
  const [step, setStep] = useState('name')
  const [formData, setFormData] = useState({
    name: '',
    schedule: { kind: 'every', everyMs: 300000 },
    payload: { kind: 'exec', command: '' },
    delivery: { mode: 'none' }
  })

  const fetchJobs = () => {
    setLoading(true)
    fetch('/api/cron')
      .then(r => r.json())
      .then(data => {
        setJobs(data.jobs || [])
        setLoading(false)
      })
      .catch(() => {
        setJobs([])
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 10000)
    return () => clearInterval(interval)
  }, [])

  const resetForm = () => {
    setStep('name')
    setFormData({
      name: '',
      schedule: { kind: 'every', everyMs: 300000 },
      payload: { kind: 'exec', command: '' },
      delivery: { mode: 'none' }
    })
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Job created!' })
        setShowAdd(false)
        resetForm()
        fetchJobs()
      } else {
        const err = await res.json()
        setMessage({ type: 'error', text: err.error || 'Failed' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const toggleJob = async (id) => {
    try {
      const res = await fetch(`/api/cron/${id}/toggle`, { method: 'POST' })
      if (res.ok) fetchJobs()
    } catch (err) {
      console.error(err)
    }
  }

  const runJob = async (id) => {
    try {
      await fetch(`/api/cron/${id}/run`, { method: 'POST' })
      setMessage({ type: 'success', text: 'Job triggered' })
      setTimeout(() => setMessage(null), 2000)
      fetchJobs()
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed' })
    }
  }

  const deleteJob = async (id) => {
    if (!confirm('Delete this job?')) return
    try {
      await fetch(`/api/cron/${id}`, { method: 'DELETE' })
      fetchJobs()
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete' })
    }
  }

  const formatSchedule = (schedule) => {
    const preset = SCHEDULE_PRESETS.find(p => 
      p.kind === schedule.kind && (p.everyMs === schedule.everyMs || p.expr === schedule.expr)
    )
    return preset?.label || schedule.kind
  }

  const formatTime = (t) => t ? new Date(t).toLocaleString() : 'Never'

  // Wizard steps
  const STEPS = ['name', 'schedule', 'type', 'command', 'delivery', 'review']
  const currentStepIndex = STEPS.indexOf(step)

  const goNext = () => {
    const next = STEPS[currentStepIndex + 1]
    if (next) setStep(next)
  }

  const goBack = () => {
    const prev = STEPS[currentStepIndex - 1]
    if (prev) setStep(prev)
  }

  // Render wizard content based on step
  const renderStep = () => {
    switch (step) {
      case 'name':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium">What should we call this job?</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Check server status"
              className="input text-lg"
              autoFocus
            />
            <p className="text-xs text-[var(--rar-text-muted)]">Give it a clear name so you remember what it does</p>
          </div>
        )
      
      case 'schedule':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium">How often should it run?</label>
            <div className="grid grid-cols-1 gap-2">
              {SCHEDULE_PRESETS.map(preset => {
                const selected = formData.schedule.kind === preset.kind && 
                  (formData.schedule.everyMs === preset.everyMs || formData.schedule.expr === preset.expr)
                return (
                  <button
                    key={preset.label}
                    onClick={() => setFormData({
                      ...formData, 
                      schedule: { kind: preset.kind, everyMs: preset.everyMs, expr: preset.expr }
                    })}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      selected 
                        ? 'border-[var(--rar-accent)] bg-[var(--rar-accent-dim)]' 
                        : 'border-[var(--rar-border)] bg-[var(--rar-surface)]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selected ? 'border-[var(--rar-accent)]' : 'border-[var(--rar-border)]'
                    }`}>
                      {selected && <div className="w-2.5 h-2.5 rounded-full bg-[var(--rar-accent)]" />}
                    </div>
                    <span className="flex-1 text-left font-medium">{preset.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      
      case 'type':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium">What should it do?</label>
            <div className="grid grid-cols-1 gap-2">
              {PAYLOAD_TYPES.map(type => {
                const selected = formData.payload.kind === type.id
                return (
                  <button
                    key={type.id}
                    onClick={() => setFormData({...formData, payload: { ...formData.payload, kind: type.id }})}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      selected 
                        ? 'border-[var(--rar-accent)] bg-[var(--rar-accent-dim)]' 
                        : 'border-[var(--rar-border)] bg-[var(--rar-surface)]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selected ? 'bg-[var(--rar-accent)]' : 'bg-[var(--rar-surface-hover)]'
                    }`}>
                      <type.icon size={20} className={selected ? 'text-white' : 'text-[var(--rar-text-muted)]'} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-[var(--rar-text-muted)]">{type.desc}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selected ? 'border-[var(--rar-accent)]' : 'border-[var(--rar-border)]'
                    }`}>
                      {selected && <div className="w-2.5 h-2.5 rounded-full bg-[var(--rar-accent)]" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      
      case 'command':
        const placeholders = {
          exec: 'curl -s https://api.example.com | jq .status',
          webhook: 'https://hooks.slack.com/services/...',
          systemEvent: 'Check the server logs and summarize',
          agentTurn: 'Research the latest crypto news'
        }
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium">Enter the {formData.payload.kind === 'exec' ? 'command' : formData.payload.kind === 'webhook' ? 'URL' : 'message'}</label>
            <textarea
              value={formData.payload.command || formData.payload.message || formData.payload.url || ''}
              onChange={e => {
                const val = e.target.value
                const newPayload = {...formData.payload}
                if (formData.payload.kind === 'exec') newPayload.command = val
                else if (formData.payload.kind === 'webhook') newPayload.url = val
                else newPayload.message = newPayload.text = val
                setFormData({...formData, payload: newPayload})
              }}
              placeholder={placeholders[formData.payload.kind]}
              className="input min-h-[100px] resize-none"
              rows={3}
            />
          </div>
        )
      
      case 'delivery':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium">Where should results go?</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'none', label: 'Silent', desc: 'No notification', icon: Check },
                { id: 'announce', label: 'Announce', desc: 'Send to main channel', icon: Bell }
              ].map(mode => {
                const selected = formData.delivery.mode === mode.id
                return (
                  <button
                    key={mode.id}
                    onClick={() => setFormData({...formData, delivery: { mode: mode.id }})}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      selected 
                        ? 'border-[var(--rar-accent)] bg-[var(--rar-accent-dim)]' 
                        : 'border-[var(--rar-border)] bg-[var(--rar-surface)]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selected ? 'bg-[var(--rar-accent)]' : 'bg-[var(--rar-surface-hover)]'
                    }`}>
                      <mode.icon size={20} className={selected ? 'text-white' : 'text-[var(--rar-text-muted)]'} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{mode.label}</div>
                      <div className="text-xs text-[var(--rar-text-muted)]">{mode.desc}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selected ? 'border-[var(--rar-accent)]' : 'border-[var(--rar-border)]'
                    }`}>
                      {selected && <div className="w-2.5 h-2.5 rounded-full bg-[var(--rar-accent)]" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      
      case 'review':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium">Review your job</label>
            <div className="bg-[var(--rar-surface-hover)] rounded-xl p-4 space-y-3">
              <div>
                <div className="text-xs text-[var(--rar-text-muted)] uppercase">Name</div>
                <div className="font-medium">{formData.name}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--rar-text-muted)] uppercase">Schedule</div>
                <div className="font-medium">{formatSchedule(formData.schedule)}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--rar-text-muted)] uppercase">Action</div>
                <div className="font-medium">{PAYLOAD_TYPES.find(t => t.id === formData.payload.kind)?.label}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--rar-text-muted)] uppercase">Notification</div>
                <div className="font-medium capitalize">{formData.delivery.mode}</div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  const canProceed = () => {
    switch (step) {
      case 'name': return formData.name.trim().length > 0
      case 'schedule': return true
      case 'type': return true
      case 'command': {
        const val = formData.payload.command || formData.payload.message || formData.payload.url || ''
        return val.trim().length > 0
      }
      case 'delivery': return true
      default: return true
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl skeleton" />
          <div className="space-y-2">
            <div className="w-24 h-5 skeleton" />
            <div className="w-16 h-4 skeleton" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--rar-accent-dim)] flex items-center justify-center">
            <Clock className="text-[var(--rar-accent)]" size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">Cron Jobs</h1>
            <p className="text-xs sm:text-sm text-[var(--rar-text-muted)]">{jobs.filter(j => j.enabled).length} active / {jobs.length} total</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={fetchJobs} className="btn btn-secondary p-2">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">
            <Plus size={16} />
            <span className="hidden sm:inline ml-1">New</span>
          </button>
        </div>
      </div>

      <div className="divider" />

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Full-screen Wizard Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-[var(--rar-bg)] flex flex-col">
          {/* Wizard Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--rar-border)]">
            <button 
              onClick={currentStepIndex > 0 ? goBack : () => { setShowAdd(false); resetForm(); }}
              className="btn btn-ghost p-2 -ml-2"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="flex items-center gap-1.5">
              {STEPS.map((s, i) => (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all ${
                    i <= currentStepIndex ? 'w-4 bg-[var(--rar-accent)]' : 'w-1.5 bg-[var(--rar-border)]'
                  }`} 
                />
              ))}
            </div>
            
            <button onClick={() => { setShowAdd(false); resetForm(); }} className="btn btn-ghost p-2 -mr-2">
              <X size={20} />
            </button>
          </div>

          {/* Wizard Content */}
          <div className="flex-1 overflow-auto p-4">
            {renderStep()}
          </div>

          {/* Wizard Footer */}
          <div className="p-4 border-t border-[var(--rar-border)]">
            {step === 'review' ? (
              <button 
                onClick={handleSubmit} 
                className="btn btn-primary w-full py-3"
              >
                <Zap size={18} /> Create Job
              </button>
            ) : (
              <button 
                onClick={goNext} 
                disabled={!canProceed()}
                className="btn btn-primary w-full py-3"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      )}

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Clock size={28} />
          </div>
          <h3 className="text-lg font-medium mb-1">No cron jobs</h3>
          <p className="text-sm text-[var(--rar-text-muted)]">Tap "New" to create one</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <div key={job.id} className="card">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{job.name}</span>
                      {!job.enabled && <span className="badge-neutral text-xs">Paused</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-[var(--rar-text-muted)]">
                        <Repeat size={12} /> {formatSchedule(job.schedule)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button 
                      onClick={() => toggleJob(job.id)}
                      className={`btn btn-ghost p-2 ${job.enabled ? 'text-green-400' : 'text-gray-400'}`}
                    >
                      {job.enabled ? <Power size={16} /> : <Pause size={16} />}
                    </button>
                    <button 
                      onClick={() => runJob(job.id)}
                      className="btn btn-ghost p-2"
                    >
                      <Play size={16} />
                    </button>
                    <button 
                      onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                      className="btn btn-ghost p-2"
                    >
                      {expandedJob === job.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button 
                      onClick={() => deleteJob(job.id)}
                      className="btn btn-ghost p-2 text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {expandedJob === job.id && (
                  <div className="mt-4 pt-4 border-t border-[var(--rar-border)] space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-[var(--rar-text-muted)]">Last Run</div>
                        <div>{formatTime(job.lastRun)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--rar-text-muted)]">Next Run</div>
                        <div>{formatTime(job.nextRun)}</div>
                      </div>
                    </div>
                    
                    {job.runHistory?.length > 0 && (
                      <div>
                        <div className="text-xs text-[var(--rar-text-muted)] mb-2">History ({job.runCount} runs)</div>
                        <div className="space-y-1">
                          {job.runHistory.slice(0, 3).map((run, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs p-2 bg-[var(--rar-surface-hover)] rounded">
                              <div className={`w-2 h-2 rounded-full ${
                                run.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <span className="text-[var(--rar-text-muted)]">{new Date(run.startedAt).toLocaleTimeString()}</span>
                              {run.error && <span className="text-red-400 truncate">{run.error}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Cron