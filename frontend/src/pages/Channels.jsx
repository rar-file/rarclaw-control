import { useState, useEffect } from 'react'
import { MessageSquare, Check, X } from 'lucide-react'

function Channels() {
  const [channels, setChannels] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/channels')
      .then(r => r.json())
      .then(data => {
        setChannels(data || {})
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load channels:', err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>

  const channelList = Object.entries(channels)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="text-rar-accent" />
        Channel Hub
      </h1>

      <div className="grid grid-cols-2 gap-4">
        {channelList.map(([name, config]) => (
          <div key={name} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  config.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                }`}>
                  {config.enabled ? <Check size={20} /> : <X size={20} />}
                </div>
                <div>
                  <div className="font-semibold capitalize">{name}</div>
                  <div className="text-sm text-gray-400">{config.enabled ? 'Connected' : 'Disabled'}</div>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={config.enabled} className="sr-only peer" readOnly />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rar-accent"></div>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Channels