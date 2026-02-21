import React, { useState, useEffect } from 'react'
import { Globe, Camera, RefreshCw, MousePointer } from 'lucide-react'

function Browser() {
  const [status, setStatus] = useState(null)
  const [tabs, setTabs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = () => {
    setLoading(true)
    fetch('/api/browser/status')
      .then(r => r.json())
      .then(data => {
        setStatus(data)
        if (data.running) {
          fetchTabs()
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Browser not available:', err)
        setStatus({ running: false, error: err.message })
        setLoading(false)
      })
  }

  const fetchTabs = () => {
    fetch('/api/browser/tabs')
      .then(r => r.json())
      .then(data => setTabs(data || []))
      .catch(console.error)
  }

  const takeScreenshot = () => {
    fetch('/api/browser/screenshot', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.path) {
          window.open(`/api/browser/screenshot/view?path=${data.path}`, '_blank')
        }
      })
  }

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Globe className="text-rar-accent" />
        Browser Remote
      </h1>

      {!status?.running ? (
        <div className="card text-center py-12">
          <Globe size={48} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">Browser is not running</p>
          <p className="text-sm text-gray-500 mt-2">Start OpenClaw browser to enable remote control</p>
          <button onClick={fetchStatus} className="btn-secondary mt-4 flex items-center gap-2 mx-auto">
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Browser running on {status.cdpUrl}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={takeScreenshot} className="btn-secondary flex items-center gap-2">
                <Camera size={14} />
                Screenshot
              </button>
              <button onClick={fetchTabs} className="btn-secondary flex items-center gap-2">
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Open Tabs ({tabs.length})</h3>
            
            {tabs.length === 0 ? (
              <p className="text-gray-400">No tabs open</p>
            ) : (
              <div className="space-y-2">
                {tabs.map((tab, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-rar-700/50 rounded">
                    <div className="flex items-center gap-3">
                      <MousePointer size={14} className="text-gray-400" />
                      <div>
                        <div className="font-medium truncate max-w-md">{tab.title || 'Untitled'}</div>
                        <div className="text-sm text-gray-400 truncate max-w-md">{tab.url}</div>
                      </div>
                    </div>
                    <button className="btn-primary text-sm">Focus</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Browser