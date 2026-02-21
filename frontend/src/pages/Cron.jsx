import React, { useState, useEffect } from 'react'
import { 
  Clock, Plus, Play, Trash2, RefreshCw, AlertCircle, CheckCircle, 
  Pause, Power, History, Terminal, Globe, MessageSquare, Bell,
  ChevronDown, ChevronUp, Calendar, Repeat, Zap
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
  { label: 'Once (now + delay)', kind: 'once' },
]

const PAYLOAD_TYPES = [
  { id: 'exec', label: 'Shell Command', icon: Terminal, desc: 'Run a shell command' },
  { id: 'webhook', label: 'Webhook', icon: Globe, desc: 'Call a URL' },
  { id: 'systemEvent', label: 'System Event', icon: Bell, desc: 'Inject into main session' },
  { id: 'agentTurn', label: 'Agent Turn', icon: MessageSquare, desc: 'Spawn a sub-agent' },
]

function Cron() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [expandedJob, setExpandedJob] = useState(null)
  const [message, setMessage] = useState(null)
  
  // Form state
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

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Job created successfully' })
        setShowAdd(false)
        resetForm()
        fetchJobs()
      } else {
        const err = await res.json()
        setMessage({ type: 'error', text: err.error || 'Failed to create' })
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
      if (res.ok) {
        fetchJobs()
      }
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
      setMessage({ type: 'error', text: 'Failed to trigger' })
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
    if (!t) return '—'
    return new Date(t).toLocaleString()
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--rar-accent)]/10 flex items-center justify-center">
            <Clock className="text-[var(--rar-accent)]" size={24} />
          </div>
          <div>
            <h1 className="page-title">Cron Jobs</h1>
            <p className="page-subtitle">{jobs.filter(j => j.enabled).length} active / {jobs.length} total</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={fetchJobs} className="btn-secondary p-2.5">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-[var(--rar-surface)] rounded-xl border border-[var(--rar-border)] w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-[var(--rar-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--rar-text-muted)]">Step {step} of 3</span>
                <div className="flex gap-1">
                  {[1,2,3].map(i => (
                    <div key={i} className={`w-6 h-1 rounded-full ${i === step ? 'bg-[var(--rar-accent)]' : 'bg-[var(--rar-border)]'}`} />
                  ))}
                </div>
              </div>
              <button onClick={() => setShowAdd(false)} className="btn-ghost p-1">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {step === 1 && (
                <>
                  <label className="block text-sm text-[var(--rar-text-muted)] mb-2">Job Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Daily backup"
                    className="input mb-4"
                    autoFocus
                  />
                  
                  <label className="block text-sm text-[var(--rar-text-muted)] mb-2">Schedule</label>
                  <div className="grid gap-2">
                    {SCHEDULE_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        onClick={() => setFormData({...formData, schedule: { kind: preset.kind, everyMs: preset.everyMs, expr: preset.expr }})}
                        className={`p-3 rounded-lg border text-left transition ${
                          formData.schedule.kind === preset.kind && (formData.schedule.everyMs === preset.everyMs || formData.schedule.expr === preset.expr)
                            ? 'border-[var(--rar-accent)] bg-[var(--rar-accent)]/10'
                            : 'border-[var(--rar-border)] hover:border-[var(--rar-border-hover)]'
                        }`}
                      >
                        <div className="font-medium">{preset.label}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <label className="block text-sm text-[var(--rar-text-muted)] mb-2">What to Execute</label>
                  <div className="grid gap-2 mb-4">
                    {PAYLOAD_TYPES.map(type => (
                      <button
                        key={type.id}
                        onClick={() => setFormData({...formData, payload: { ...formData.payload, kind: type.id }})}
                        className={`p-3 rounded-lg border text-left transition flex items-center gap-3 ${
                          formData.payload.kind === type.id
                            ? 'border-[var(--rar-accent)] bg-[var(--rar-accent)]/10'
                            : 'border-[var(--rar-border)] hover:border-[var(--rar-border-hover)]'
                        }`}
                      >
                        <type.icon size={18} className={formData.payload.kind === type.id ? 'text-[var(--rar-accent)]' : 'text-[var(--rar-text-muted)]'} />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-[var(--rar-text-muted)]">{type.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <label className="block text-sm text-[var(--rar-text-muted)] mb-2">Command / Message</label>
                  <input
                    type="text"
                    value={formData.payload.command || formData.payload.message || formData.payload.url || ''}
                    onChange={e => {
                      const val = e.target.value
                      if (formData.payload.kind === 'exec') {
                        setFormData({...formData, payload: {...formData.payload, command: val}})
                      } else if (formData.payload.kind === 'webhook') {
                        setFormData({...formData, payload: {...formData.payload, url: val}})
                      } else {
                        setFormData({...formData, payload: {...formData.payload, message: val, text: val}})
                      }
                    }}
                    placeholder={formData.payload.kind === 'exec' ? 'curl https://api.example.com' : formData.payload.kind === 'webhook' ? 'https://hooks.slack.com/...' : 'Check the server status'}
                    className="input"
                  />
                </>
              )}

              {step === 3 && (
                <>
                  <label className="block text-sm text-[var(--rar-text-muted)] mb-2">Delivery Mode</label>
                  <div className="grid gap-2">
                    {[
                      { id: 'none', label: 'Silent', desc: 'No notification' },
                      { id: 'announce', label: 'Announce', desc: 'Send to configured channel' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setFormData({...formData, delivery: { mode: mode.id }})}
                        className={`p-3 rounded-lg border text-left transition ${
                          formData.delivery.mode === mode.id
                            ? 'border-[var(--rar-accent)] bg-[var(--rar-accent)]/10'
                            : 'border-[var(--rar-border)] hover:border-[var(--rar-border-hover)]'
                        }`}
                      >
                        <div className="font-medium">{mode.label}</div>
                        <div className="text-xs text-[var(--rar-text-muted)]">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-[var(--rar-surface-hover)] rounded-lg">
                    <div className="text-xs text-[var(--rar-text-muted)] mb-1">Summary</div>
                    <div className="font-medium">{formData.name || 'Unnamed job'}</div>
                    <div className="text-sm text-[var(--rar-text-secondary)]">{formatSchedule(formData.schedule)}</div>
                    <div className="text-xs text-[var(--rar-text-muted)] mt-1">{PAYLOAD_TYPES.find(t => t.id === formData.payload.kind)?.label}</div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-[var(--rar-border)] flex justify-between">
              {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="btn-secondary">Back</button>
              ) : (
                <button onClick={() => { setShowAdd(false); resetForm(); }} className="btn-secondary">Cancel</button>
              )}
              
              {step < 3 ? (
                <button 
                  onClick={() => setStep(step + 1)} 
                  className="btn-primary"
                  disabled={step === 1 && !formData.name}
                >
                  Next
                </button>
              ) : (
                <button onClick={handleSubmit} className="btn-primary">
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
          <p className="text-sm text-[var(--rar-text-muted)]">Schedule automated tasks</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <div key={job.id} className="card overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{job.name}</span>
                      {!job.enabled && <span className="badge-neutral">Paused</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-[var(--rar-text-muted)]">
                        <Repeat size={12} /> {formatSchedule(job.schedule)}
                      </span>
                      <span className="badge-neutral">
                        {PAYLOAD_TYPES.find(t => t.id === job.payload.kind)?.label || job.payload.kind}
                      </span>
                      {job.runCount > 0 && (
                        <span className="text-xs text-[var(--rar-text-muted)]">
                          Ran {job.runCount} times
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => toggleJob(job.id)}
                      className={`btn-ghost p-2 ${job.enabled ? 'text-green-400' : 'text-gray-400'}`}
                      title={job.enabled ? 'Disable' : 'Enable'}
                    >
                      {job.enabled ? <Power size={16} /> : <Pause size={16} />}
                    </button>
                    <button 
                      onClick={() => runJob(job.id)}
                      className="btn-ghost p-2"
                      title="Run now"
                    >
                      <Play size={16} />
                    </button>
                    <button 
                      onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                      className="btn-ghost p-2"
                    >
                      {expandedJob === job.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button 
                      onClick={() => deleteJob(job.id)}
                      className="btn-ghost p-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Expanded details */}
                {expandedJob === job.id && (
                  <div className="mt-4 pt-4 border-t border-[var(--rar-border)] space-y-3">
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-[var(--rar-text-muted)]">Last run</div>
                        <div>{formatTime(job.lastRun)}</div>
                      </div>
                      <div>
                        <div className="text-[var(--rar-text-muted)]">Next run</div>
                        <div>{formatTime(job.nextRun)}</div>
                      </div>
                    </div>
                    
                    {job.runHistory?.length > 0 && (
                      <div>
                        <div className="text-sm text-[var(--rar-text-muted)] mb-2 flex items-center gap-1">
                          <History size={14} /> Recent runs
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
                                <span className="truncate max-w-[200px]">{run.output}</span>
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