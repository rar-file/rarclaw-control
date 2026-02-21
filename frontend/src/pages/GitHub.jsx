import { useState, useEffect } from 'react'
import { Github, Star, GitFork, ExternalLink } from 'lucide-react'

function GitHub() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/github/repos')
      .then(r => r.json())
      .then(data => {
        setRepos(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load repos:', err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Github className="text-rar-accent" />
        GitHub
      </h1>

      {repos.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No repositories found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {repos.map((repo) => (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="card hover:border-rar-accent transition group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-lg group-hover:text-rar-accent transition">
                    {repo.name}
                  </div>
                  <p className="text-gray-400 mt-1 text-sm line-clamp-2">{repo.description || 'No description'}</p>
                </div>
                <ExternalLink size={16} className="text-gray-500" />
              </div>
              
              <div className="flex items-center gap-4 mt-4 text-sm">
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-rar-accent"></span>
                    {repo.language}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Star size={14} />
                  {repo.stargazers_count}
                </span>
                
                <span className="flex items-center gap-1">
                  <GitFork size={14} />
                  {repo.forks_count}
                </span>
                
                <span className="text-gray-500">
                  Updated {new Date(repo.updated_at).toLocaleDateString()}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default GitHub