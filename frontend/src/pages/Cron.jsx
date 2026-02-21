import { useState, useEffect } from 'react'
import { Clock, Plus, Play, Trash } from 'lucide-react'

function Cron() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cron')
      .then(r => r.json())
      .then(data => {
        setJobs(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load cron:', err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="text-rar-accent" />
          Cron Jobs
        </h1>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="card text-center py-12">
          <Clock size={48} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No cron jobs scheduled</p>
          <p className="text-sm text-gray-500 mt-2">Create a job to automate tasks</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, idx) => (
            <div key={idx} className="card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${job.enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                <div>
                  <div className="font-semibold">{job.name || `Job ${idx + 1}`}</div>
                  <div className="text-sm text-gray-400">{job.schedule || 'No schedule'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-rar-700 rounded">
                  <Play size={16} />
                </button>
                <button className="p-2 hover:bg-red-900/50 rounded text-red-400">
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Cron