import React, { useState, useEffect } from 'react'
import { Brain, FileText, Search, Edit } from 'lucide-react'

function Memory() {
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/memory')
      .then(r => r.json())
      .then(data => {
        setFiles(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load memory:', err)
        setLoading(false)
      })
  }, [])

  const loadFile = (filename) => {
    fetch(`/api/memory/${filename}`)
      .then(r => r.text())
      .then(text => {
        setSelectedFile(filename)
        setContent(text)
      })
  }

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Brain className="text-rar-accent" />
        Memory Explorer
      </h1>

      <div className="grid grid-cols-3 gap-4">
        {/* File list */}
        <div className="card h-[calc(100vh-200px)] overflow-auto">
          <div className="flex items-center gap-2 mb-4">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search files..."
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
          
          <div className="space-y-1">
            {files.map((file, idx) => (
              <button
                key={idx}
                onClick={() => loadFile(file.name)}
                className={`w-full text-left p-2 rounded flex items-center gap-2 transition ${
                  selectedFile === file.name ? 'bg-rar-accent text-white' : 'hover:bg-rar-700'
                }`}
              >
                <FileText size={16} />
                <div className="flex-1 truncate">{file.name}</div>
                <div className="text-xs opacity-60">{file.size}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Content viewer */}
        <div className="col-span-2 card h-[calc(100vh-200px)]">
          {selectedFile ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-rar-700">
                <div className="font-semibold">{selectedFile}</div>
                <button className="btn-secondary flex items-center gap-2">
                  <Edit size={14} />
                  Edit
                </button>
              </div>
              <pre className="flex-1 overflow-auto text-sm font-mono whitespace-pre-wrap">{content}</pre>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select a file to view
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Memory