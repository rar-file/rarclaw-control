import React, { useState, useEffect } from 'react'
import { Globe, Folder, FileText, RefreshCw, ChevronRight } from 'lucide-react'

function Files() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')

  const fetchFiles = () => {
    setLoading(true)
    fetch('/api/files')
      .then(r => r.json())
      .then(data => {
        setFiles(data.files || [])
        setLoading(false)
      })
      .catch(() => {
        setFiles([])
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const loadFile = (path) => {
    fetch(`/api/files/content?path=${encodeURIComponent(path)}`)
      .then(r => r.json())
      .then(data => {
        setSelectedFile(data.path)
        setFileContent(data.content)
      })
  }

  // Group files by directory
  const grouped = files.reduce((acc, file) => {
    const dir = file.path.includes('/') ? file.path.split('/')[0] : 'Root'
    if (!acc[dir]) acc[dir] = []
    acc[dir].push(file)
    return acc
  }, {})

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--rar-accent-dim)] flex items-center justify-center">
            <Globe className="text-[var(--rar-accent)]" size={24} />
          </div>
          <div>
            <h1 className="page-title">Files</h1>
            <p className="page-subtitle">{files.length} files</p>
          </div>
        </div>
        
        <button onClick={fetchFiles} className="btn btn-secondary p-2.5">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="divider" />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* File tree */}
        <div className="card">
          <div className="p-3 border-b border-[var(--rar-border)] font-medium">
            Workspace Files
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {Object.entries(grouped).map(([dir, dirFiles]) => (
              <div key={dir} className="border-b border-[var(--rar-border)] last:border-0">
                <div className="flex items-center gap-2 p-3 bg-[var(--rar-surface-hover)]">
                  <Folder size={16} className="text-[var(--rar-text-muted)]" />
                  <span className="font-medium text-sm">{dir}</span>
                  <span className="text-xs text-[var(--rar-text-muted)]">({dirFiles.length})</span>
                </div>
                <div className="divide-y divide-[var(--rar-border)]">
                  {dirFiles.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadFile(file.path)}
                      className={`w-full flex items-center gap-2 p-2 pl-8 text-left hover:bg-[var(--rar-surface-hover)] transition ${
                        selectedFile === file.path ? 'bg-[var(--rar-accent-dim)]' : ''
                      }`}
                    >
                      <FileText size={14} className="text-[var(--rar-text-muted)]" />
                      <span className="text-sm truncate flex-1">{file.path.split('/').pop()}</span>
                      <span className="text-xs text-[var(--rar-text-muted)]">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <ChevronRight size={14} className="text-[var(--rar-text-muted)]" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File viewer */}
        <div className="card">
          <div className="p-3 border-b border-[var(--rar-border)] font-medium">
            {selectedFile || 'Select a file'}
          </div>
          <div className="p-4">
            {selectedFile ? (
              <pre className="text-xs overflow-auto max-h-[350px] font-mono text-[var(--rar-text-secondary)] whitespace-pre-wrap">
                {fileContent}
              </pre>
            ) : (
              <div className="text-center py-12 text-[var(--rar-text-muted)]">
                <FileText size={32} className="mx-auto mb-3" />
                <p>Select a file to view</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Files
