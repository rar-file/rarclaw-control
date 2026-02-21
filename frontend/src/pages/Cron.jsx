import React, { useState, useEffect } from 'react'
import { 
  Clock, Plus, Play, Trash2, RefreshCw, AlertCircle, CheckCircle, 
  Pause, Power, History, Terminal, Globe, MessageSquare, Bell,
  ChevronDown, ChevronUp, Repeat, Zap, X
} from 'lucide-react'

const SCHEDULE_PRESETS = [
  { label: 'Every minute', kind: 'every', everyMs: 60000 },
  { label: 'Every 5 minutes', kind: 'every', everyMs: 300000 },
  { label: 'Every 15 minutes', kind: 'every', everyMs: 900000 },
  { label: 'Every 30 minutes', kind: 'every', everyMs: 1800000 },
  { label: 'Every hour', kind: 'every', everyMs: 3600000 },
  { label: 'Daily at 9am', kind: 'cron', expr: '0 9 * * *' },
  { label: 'Daily at 6pm', kind: 'cron', expr: '0 18 * * *' },
  { label: 'Weekly (Monday)', kind: 'cron', expr: '0 9 * * 1' },
  { label: 'Once only', kind: 'once' },
]

const PAYLOAD_TYPES = [
  { id: 'exec', label: 'Shell Command', icon: Terminal, desc: 'Run shell commands' },
  { id: 'webhook', label: 'Webhook', icon: Globe, desc: 'Call external URL' },
  { id: 'systemEvent', label: 'System Event', icon: Bell, desc: 'Inject to main session' },
  { id: 'agentTurn', label: 'Agent Turn', icon: MessageSquare, desc: 'Spawn sub-agent' },
]

function Cron() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [expandedJob, setExpandedJob] = useState(null)
  const [message, setMessage] = useState(null)
  
  const [step, setStep] = useState(1)
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

  const isSelectedSchedule = (preset) => {
    return formData.schedule.kind === preset.kind && (formData.schedule.everyMs === preset.everyMs || formData.schedule.expr === preset.expr)
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

  const resetForm = () => {
    setStep(1)
    setFormData({
      name: '',
      schedule: { kind: 'every', everyMs: 300000 },
      payload: { kind: 'exec', command: '' },
      delivery: { mode: 'none' }
    })
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
    if (preset) return preset.label
    if (schedule.kind === 'cron') return schedule.expr
    if (schedule.kind === 'every') return `Every ${schedule.everyMs / 60000}m`
    return schedule.kind
  }

  const formatTime = (t) => {
    if (!t) return 'Never'
    return new Date(t).toLocaleString()
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--rar-accent-dim)] flex items-center justify-center">
            <Clock className="text-[var(--rar-accent)]" size={24} />
          </div>
          <div>
            <h1 className="page-title">Cron Jobs</h1>
            <p className="page-subtitle">{jobs.filter(j => j.enabled).length} active / {jobs.length} total</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={fetchJobs} className="btn btn-secondary p-2.5">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">
            <Plus size={16} />
            <span className="hidden sm:inline">New Job</span>
          </button>
        </div>
      </div>

      <div className="divider" />

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Create Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-[var(--rar-surface)] rounded-xl border border-[var(--rar-border)] w-full max-w-md max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="p-4 border-b border-[var(--rar-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--rar-text-muted)]">Step {step} of 3</span>
                <div className="flex gap-1.5">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-1.5 rounded-full transition-all ${
                      i === step ? 'w-6 bg-[var(--rar-accent)]' : 'w-1.5 bg-[var(--rar-border)]'
                    }`} />
                  ))}
                </div>
              </div>
              <button onClick={() => setShowAdd(false)} className="btn btn-ghost p-1.5">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Step 1: Name & Schedule */}
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--rar-text-secondary)] mb-2">Job Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Daily backup"
                      className="input"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[var(--rar-text-secondary)] mb-2">How often? *</label>
                    <div className="grid gap-2">
                      {SCHEDULE_PRESETS.map(preset => (
                        <button
                          key={preset.label}
                          onClick={() => setFormData({
                            ...formData, 
                            schedule: { 
                              kind: preset.kind, 
                              everyMs: preset.everyMs, 
                              expr: preset.expr 
                            }
                          })}
                          className={`select-card ${isSelectedSchedule(preset) ? 'selected' : ''}`}
                        >
                          <Repeat size={18} className="select-card-icon" />
                          <span className="font-medium">{preset.label}</span>
                          {isSelectedSchedule(preset) && <CheckCircle size={16} className="ml-auto text-[var(--rar-accent)]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Payload Type & Command */}
              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--rar-text-secondary)] mb-2">What should it do? *</label>
                    <div className="grid gap-2">
                      {PAYLOAD_TYPES.map(type => (
                        <button
                          key={type.id}
                          onClick={() => setFormData({...formData, payload: { ...formData.payload, kind: type.id }})}
                          className={`select-card ${formData.payload.kind === type.id ? 'selected' : ''}`}
                        >
                          <type.icon size={18} className="select-card-icon" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-[var(--rar-text-muted)]">{type.desc}</div>
                          </div>
                          {formData.payload.kind === type.id && <CheckCircle size={16} className="ml-auto text-[var(--rar-accent)]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[var(--rar-text-secondary)] mb-2">Command / Message *</label>
                    <input
                      type="text"
                      value={formData.payload.command || formData.payload.message || formData.payload.url || ''}
                      onChange={e => {
                        const val = e.target.value
                        const newPayload = {...formData.payload}
                        if (formData.payload.kind === 'exec') newPayload.command = val
                        else if (formData.payload.kind === 'webhook') newPayload.url = val
                        else newPayload.message = newPayload.text = val
                        setFormData({...formData, payload: newPayload})
                      }}
                      placeholder={
                        formData.payload.kind === 'exec' ? 'curl https://api.example.com' : 
                        formData.payload.kind === 'webhook' ? 'https://hooks.slack.com/...' : 
                        'Check server status and report'
                      }
                      className="input"
                    />
                  </div>
                </>
              )}

              {/* Step 3: Delivery & Summary */}
              {step === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--rar-text-secondary)] mb-2">Notify where? *</label>
                    <div className="grid gap-2">
                      {[
                        { id: 'none', label: 'Silent', desc: 'No notification' },
                        { id: 'announce', label: 'Announce', desc: 'Send to main channel' }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => setFormData({...formData, delivery: { mode: mode.id }})}
                          className={`select-card ${formData.delivery.mode === mode.id ? 'selected' : ''}`}
                        >
                          <Bell size={18} className="select-card-icon" />
                          <div>
                            <div className="font-medium">{mode.label}</div>
                            <div className="text-xs text-[var(--rar-text-muted)]">{mode.desc}</div>
                          </div>
                          {formData.delivery.mode === mode.id && <CheckCircle size={16} className="ml-auto text-[var(--rar-accent)]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-[var(--rar-surface-hover)] rounded-lg border border-[var(--rar-border)]">
                    <div className="text-xs text-[var(--rar-text-muted)] uppercase tracking-wide mb-2">Summary</div>
                    <div className="space-y-1">
                      <div className="font-medium">{formData.name || 'Unnamed job'}</div>
                      <div className="text-sm text-[var(--rar-text-secondary)] flex items-center gap-1">
                        <Repeat size={12} /> {formatSchedule(formData.schedule)}
                      </div>
                      <div className="text-xs text-[var(--rar-text-muted)]">
                        {PAYLOAD_TYPES.find(t => t.id === formData.payload.kind)?.label}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--rar-border)] flex justify-between">
              {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="btn btn-secondary">← Back</button>
              ) : (
                <button onClick={() => { setShowAdd(false); resetForm(); }} className="btn btn-secondary">Cancel</button>
              )}
              
              {step < 3 ? (
                <button 
                  onClick={() => setStep(step + 1)} 
                  className="btn btn-primary"
                  disabled={step === 1 && !formData.name.trim()}
                >
                  Next →
                </button>
              ) : (
                <button onClick={handleSubmit} className="btn btn-primary">
                  <Zap size={16} /> Create Job
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Clock size={28} />
          </div>
          <h3 className="text-lg font-medium text-[var(--rar-text)] mb-1">No cron jobs</h3>
          <p className="text-sm text-[var(--rar-text-muted)]">Create your first scheduled task</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <div key={job.id} className="card">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{job.name}</span>
                      {!job.enabled && <span className="badge-neutral">Paused</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-[var(--rar-text-muted)]">
                        <Repeat size={12} /> {formatSchedule(job.schedule)}
                      </span>
                      <span className="badge-neutral">
                        {PAYLOAD_TYPES.find(t => t.id === job.payload.kind)?.label || job.payload.kind}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => toggleJob(job.id)}
                      className={`btn btn-ghost p-2 ${job.enabled ? 'text-green-400' : 'text-gray-400'}`}
                      title={job.enabled ? 'Disable' : 'Enable'}
                    >
                      {job.enabled ? <Power size={16} /> : <Pause size={16} />}
                    </button>
                    <button 
                      onClick={() => runJob(job.id)}
                      className="btn btn-ghost p-2"
                      title="Run now"
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
                      className="btn btn-ghost p-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {expandedJob === job.id && (
                  <div className="mt-4 pt-4 border-t border-[var(--rar-border)] space-y-3">
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-[var(--rar-text-muted)] text-xs uppercase tracking-wide">Last Run</div>
                        <div className="mt-0.5">{formatTime(job.lastRun)}</div>
                      </div>
                      <div>
                        <div className="text-[var(--rar-text-muted)] text-xs uppercase tracking-wide">Next Run</div>
                        <div className="mt-0.5">{formatTime(job.nextRun)}</div>
                      </div>
                    </div>
                    
                    {job.runHistory?.length > 0 && (
                      <div>
                        <div className="text-xs text-[var(--rar-text-muted)] mb-2 flex items-center gap-1">
                          <History size={12} /> Recent Runs ({job.runCount} total)
                        </div>
                        <div className="space-y-1">
                          {job.runHistory.slice(0, 5).map((run, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs p-2 bg-[var(--rar-surface-hover)] rounded">
                              <div className={`w-2 h-2 rounded-full ${
                                run.status === 'success' ? 'bg-green-500' : 
                                run.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                              }`} />
                              <span className="text-[var(--rar-text-muted)]">{new Date(run.startedAt).toLocaleString()}</span>
                              {run.status === 'success' && run.output && (
                                <span className="truncate max-w-[200px] text-[var(--rar-text-secondary)]">{run.output}</span>
                              )}
                              {run.error && (
                                <span className="text-red-400 truncate max-w-[200px]">{run.error}</span>
                              )}
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