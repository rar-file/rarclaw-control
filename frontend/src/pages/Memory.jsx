import React, { useState, useEffect } from 'react'
import { Brain, FileText, Search, X, Calendar } from 'lucide-react'

function Memory() {
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/memory')
      .then(r => r.json())
      .then(data => {
        setFiles(data.files || [])
        setLoading(false)
      })
      .catch(() => {
        setFiles([])
        setLoading(false)
      })
  }, [])

  const loadFile = (filename) => {
    fetch(`/api/memory/${filename}`)
      .then(r => r.json())
      .then(data => {
        setSelectedFile(filename)
        setFileContent(data.content)
      })
      .catch(() => {
        setFileContent('Error loading file')
      })
  }

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  )

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
            <Brain className="text-[var(--rar-accent)]" size={24} />
          </div>
          <div>
            <h1 className="page-title">Memory</h1>
            <p className="page-subtitle">{files.length} file{files.length !== 1 && 's'}</p>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* File list */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="p-3 border-b border-[var(--rar-border)]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--rar-text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search files..."
                  className="input pl-10"
                />
              </div>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {filteredFiles.length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--rar-text-muted)]">
                  No files found
                </div>
              ) : (
                <div className="divide-y divide-[var(--rar-border)]">
                  {filteredFiles.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadFile(file.name)}
                      className={`w-full p-3 flex items-center gap-3 text-left transition ${
                        selectedFile === file.name 
                          ? 'bg-[var(--rar-accent)]/10 border-l-2 border-[var(--rar-accent)]' 
                          : 'hover:bg-[var(--rar-surface-hover)]'
                      }`}
                    >
                      <FileText size={16} className="text-[var(--rar-text-muted)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{file.name}</div>
                        <div className="flex items-center gap-2 text-xs text-[var(--rar-text-muted)]">
                          <Calendar size={10} />
                          {new Date(file.modified).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-xs text-[var(--rar-text-muted)]">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* File viewer */}
        <div className="lg:col-span-2">
          {selectedFile ? (
            <div className="card">
              <div className="flex items-center justify-between p-3 border-b border-[var(--rar-border)]">
                <div className="font-mono text-sm text-[var(--rar-accent)]">{selectedFile}</div>
                <button 
                  onClick={() => { setSelectedFile(null); setFileContent(null); }}
                  className="btn-ghost p-1"
                >
                  <X size={16} />
                </button>
              </div>
              <pre className="p-4 text-sm overflow-auto max-h-[500px] font-mono text-[var(--rar-text-secondary)] whitespace-pre-wrap">
                {fileContent}
              </pre>
            </div>
          ) : (
            <div className="card h-64 flex items-center justify-center">
              <div className="text-center">
                <FileText size={32} className="mx-auto mb-3 text-[var(--rar-text-muted)]" />
                <p className="text-sm text-[var(--rar-text-muted)]">Select a file to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Memory