import React, { useState, useEffect } from 'react'
import { Github, Star, GitFork, ExternalLink, RefreshCw } from 'lucide-react'

function GitHub() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRepos = () => {
    setLoading(true)
    setError(null)
    fetch('/api/github/repos')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setRepos(data.repos || [])
        }
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchRepos()
  }, [])

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
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-4">
            <div className="w-48 h-4 skeleton mb-2" />
            <div className="w-full h-3 skeleton" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--rar-accent)]/10 flex items-center justify-center">
            <Github className="text-[var(--rar-text)]" size={24} />
          </div>
          <div>
            <h1 className="page-title">GitHub</h1>
            <p className="page-subtitle">{repos.length} repositories</p>
          </div>
        </div>
        
        <button onClick={fetchRepos} className="btn-secondary">
          <RefreshCw size={16} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="divider" />

      {/* Error */}
      {error && (
        <div className="card p-4 bg-red-500/10 border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Repos */}
      {repos.length === 0 && !error ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Github size={28} />
          </div>
          <h3 className="text-lg font-medium text-[var(--rar-text)] mb-1">No repositories</h3>
          <p className="text-sm text-[var(--rar-text-muted)]">Check your GitHub token</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {repos.map((repo, idx) => (
            <a
              key={idx}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-4 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-[var(--rar-accent)] group-hover:underline truncate">
                    {repo.full_name}
                  </div>
                  
                  {repo.description && (
                    <p className="text-sm text-[var(--rar-text-muted)] mt-1 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-3 text-xs text-[var(--rar-text-muted)]">
                    {repo.stars > 0 && (
                      <span className="flex items-center gap-1">
                        <Star size={12} /> {repo.stars}
                      </span>
                    )}
                    {repo.forks > 0 && (
                      <span className="flex items-center gap-1">
                        <GitFork size={12} /> {repo.forks}
                      </span>
                    )}
                    <span>
                      Updated {new Date(repo.updated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <ExternalLink 
                  size={16} 
                  className="text-[var(--rar-text-muted)] group-hover:text-[var(--rar-text)] shrink-0" 
                />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default GitHub