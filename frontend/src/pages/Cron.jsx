import React, { useState, useEffect } from 'react'
import { Clock, Plus, Play, Trash2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

function Cron() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [formData, setFormData] = useState({ name: '', schedule: '', command: '' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

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
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Cron job created' })
        setShowAdd(false)
        setFormData({ name: '', schedule: '', command: '' })
        fetchJobs()
      } else {
        const err = await res.json()
        setMessage({ type: 'error', text: err.error || 'Failed to create' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSubmitting(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const runJob = async (id) => {
    try {
      await fetch(`/api/cron/${id}/run`, { method: 'POST' })
      setMessage({ type: 'success', text: 'Job triggered' })
      setTimeout(() => setMessage(null), 2000)
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
            <p className="page-subtitle">{jobs.length} job{jobs.length !== 1 && 's'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={fetchJobs} className="btn-secondary p-2.5">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus size={16} />
            <span className="hidden sm:inline">Add Job</span>
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

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleSubmit} className="card p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm text-[var(--rar-text-muted)] mb-1.5">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Daily backup"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--rar-text-muted)] mb-1.5">Schedule</label>
              <input
                type="text"
                value={formData.schedule}
                onChange={e => setFormData({...formData, schedule: e.target.value})}
                placeholder="0 9 * * *"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--rar-text-muted)] mb-1.5">Command</label>
              <input
                type="text"
                value={formData.command}
                onChange={e => setFormData({...formData, command: e.target.value})}
                placeholder="backup.sh"
                className="input"
                required
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating...' : 'Create Job'}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
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
          {jobs.map((job, idx) => (
            <div key={job.id || idx} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-[var(--rar-text)]">{job.name}</div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="badge-neutral font-mono">{job.schedule}</span>
                    {job.enabled ? <span className="badge-success">Enabled</span> : <span className="badge-neutral">Disabled</span>}
                  </div>
                  <div className="text-sm text-[var(--rar-text-muted)] mt-2 font-mono">
                    {job.command}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => runJob(job.id)}
                    className="btn-ghost p-2"
                    title="Run now"
                  >
                    <Play size={16} />
                  </button>
                  <button 
                    onClick={() => deleteJob(job.id)}
                    className="btn-ghost p-2 text-red-400 hover:text-red-300"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Cron