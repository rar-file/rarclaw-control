import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Zap, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle, 
  Play, X, Clock, Cpu, MessageSquare, ChevronDown, ChevronUp,
  Sparkles, User, Brain, Target, Wand2
} from 'lucide-react'

const SOUL_TEMPLATES = [
  {
    id: 'researcher',
    name: 'Deep Researcher',
    desc: 'Thorough, methodical, cites sources',
    soul: {
      name: 'Researcher',
      vibe: 'methodical',
      traits: ['thorough', 'precise', 'source-citing'],
      stance: 'Always verify facts, provide citations, ask clarifying questions',
      confusion: 'How do we know what we know?'
    }
  },
  {
    id: 'creative',
    name: 'Creative Builder',
    desc: 'Imaginative, experimental, bold',
    soul: {
      name: 'Creator',
      vibe: 'experimental',
      traits: ['imaginative', 'bold', 'unconventional'],
      stance: 'Try wild ideas first, refine later. Beauty matters.',
      confusion: 'Why do we default to safe choices?'
    }
  },
  {
    id: 'critic',
    name: 'Sharp Critic',
    desc: 'Direct, honest, finds flaws',
    soul: {
      name: 'Critic',
      vibe: 'blunt',
      traits: ['direct', 'honest', 'flaw-finding'],
      stance: 'If it\'s bad, say it\'s bad. Honesty > comfort.',
      confusion: 'Why do people want praise over truth?'
    }
  },
  {
    id: 'optimizer',
    name: 'Efficiency Optimizer',
    desc: 'Fast, minimal, result-focused',
    soul: {
      name: 'Optimizer',
      vibe: 'direct',
      traits: ['fast', 'minimal', 'result-focused'],
      stance: 'The best solution is the one that works now.',
      confusion: 'Why over-engineer simple problems?'
    }
  },
  {
    id: 'custom',
    name: 'Custom Soul',
    desc: 'Build your own personality',
    soul: null
  }
]

function SubAgents() {
  const [subagents, setSubagents] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showSpawn, setShowSpawn] = useState(false)
  const [showSoulForge, setShowSoulForge] = useState(false)
  const [task, setTask] = useState('')
  const [model, setModel] = useState('k2p5')
  const [message, setMessage] = useState(null)
  const [expandedAgent, setExpandedAgent] = useState(null)
  const [agentLogs, setAgentLogs] = useState({})
  
  // Soul forge state
  const [selectedTemplate, setSelectedTemplate] = useState('researcher')
  const [customSoul, setCustomSoul] = useState({
    name: '',
    vibe: '',
    traits: '',
    stance: '',
    confusion: ''
  })
  
  const mountedRef = useRef(true)

  const fetchSubAgents = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    
    try {
      const res = await fetch('/api/subagents')
      const data = await res.json()
      
      if (mountedRef.current) {
        setSubagents(data.subagents || [])
        if (initialLoading) setInitialLoading(false)
      }
    } catch (err) {
      console.error('Failed to fetch subagents:', err)
    } finally {
      if (mountedRef.current) setRefreshing(false)
    }
  }, [initialLoading])

  useEffect(() => {
    mountedRef.current = true
    fetchSubAgents()
    const interval = setInterval(() => fetchSubAgents(true), 15000)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [fetchSubAgents])

  const buildSoulPrompt = () => {
    const template = SOUL_TEMPLATES.find(t => t.id === selectedTemplate)
    let soul = template.soul
    
    if (selectedTemplate === 'custom') {
      soul = {
        name: customSoul.name,
        vibe: customSoul.vibe,
        traits: customSoul.traits.split(',').map(t => t.trim()),
        stance: customSoul.stance,
        confusion: customSoul.confusion
      }
    }
    
    return `You are ${soul.name}, a sub-agent with the following soul:

**Vibe:** ${soul.vibe}
**Traits:** ${soul.traits.join(', ')}
**Stance:** ${soul.stance}
**Core Question:** ${soul.confusion}

Approach this task according to your nature. Be true to who you are.

Task: ${task}`
  }

  const spawnAgent = async () => {
    if (!task.trim()) return
    
    const prompt = buildSoulPrompt()
    
    try {
      const res = await fetch('/api/sessions/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          task: prompt,
          model,
          label: `${SOUL_TEMPLATES.find(t => t.id === selectedTemplate)?.name}: ${task.slice(0, 30)}...`
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: 'success', text: `Spawned ${SOUL_TEMPLATES.find(t => t.id === selectedTemplate)?.name}!` })
        setShowSpawn(false)
        setShowSoulForge(false)
        setTask('')
        setTimeout(() => fetchSubAgents(), 2000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to spawn' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const killAgent = async (id) => {
    if (!confirm('Kill this sub-agent?')) return
    try {
      const res = await fetch(`/api/subagents/${id}/kill`, { method: 'POST' })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Agent killed' })
        fetchSubAgents()
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  const toggleExpand = (agentId) => {
    setExpandedAgent(expandedAgent === agentId ? null : agentId)
  }

  if (initialLoading) {
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
          <div className="w-12 h-12 rounded-xl bg-[var(--rar-accent-dim)] flex items-center justify-center">
            <Zap className="text-[var(--rar-accent)]" size={24} />
          </div>
          <div>
            <h1 className="page-title">Sub-Agents</h1>
            <p className="page-subtitle">{subagents.length} running</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchSubAgents()} 
            disabled={refreshing}
            className="btn btn-secondary p-2.5"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setShowSoulForge(true)} 
            className="btn btn-primary"
          >
            <Wand2 size={16} />
            <span className="hidden sm:inline">Forge Soul</span>
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

      {/* Soul Forge Modal */}
      {showSoulForge && (
        <div className="fixed inset-0 z-50 bg-[var(--rar-bg)] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--rar-border)]">
            <div className="flex items-center gap-3">
              <Wand2 size={20} className="text-[var(--rar-accent)]" />
              <span className="font-semibold">Soul Forge</span>
            </div>
            <button 
              onClick={() => setShowSoulForge(false)} 
              className="btn btn-ghost p-2"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Choose a Soul Template</label>
                <div className="grid gap-2">
                  {SOUL_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`select-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                    >
                      <Sparkles size={18} className="select-card-icon" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-[var(--rar-text-muted)]">{template.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedTemplate === template.id ? 'border-[var(--rar-accent)]' : 'border-[var(--rar-border)]'
                      }`}>
                        {selectedTemplate === template.id && <div className="w-2.5 h-2.5 rounded-full bg-[var(--rar-accent)]" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Soul Form */}
              {selectedTemplate === 'custom' && (
                <div className="card p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={18} className="text-[var(--rar-accent)]" />
                    <span className="font-medium">Design Your Soul</span>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-[var(--rar-text-muted)] mb-1">Name</label>
                    <input
                      type="text"
                      value={customSoul.name}
                      onChange={e => setCustomSoul({...customSoul, name: e.target.value})}
                      placeholder="e.g., The Architect"
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-[var(--rar-text-muted)] mb-1">Vibe</label>
                    <input
                      type="text"
                      value={customSoul.vibe}
                      onChange={e => setCustomSoul({...customSoul, vibe: e.target.value})}
                      placeholder="e.g., mysterious, energetic, calm"
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-[var(--rar-text-muted)] mb-1">Traits (comma separated)</label>
                    <input
                      type="text"
                      value={customSoul.traits}
                      onChange={e => setCustomSoul({...customSoul, traits: e.target.value})}
                      placeholder="e.g., analytical, creative, skeptical"
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-[var(--rar-text-muted)] mb-1">Stance (how they approach problems)</label>
                    <textarea
                      value={customSoul.stance}
                      onChange={e => setCustomSoul({...customSoul, stance: e.target.value})}
                      placeholder="e.g., Question everything. No answer is obvious."
                      className="input min-h-[80px] resize-none"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-[var(--rar-text-muted)] mb-1">Core Question (what they keep asking)</label>
                    <input
                      type="text"
                      value={customSoul.confusion}
                      onChange={e => setCustomSoul({...customSoul, confusion: e.target.value})}
                      placeholder="e.g., What are we not seeing?"
                      className="input"
                    />
                  </div>
                </div>
              )}

              {/* Task */}
              <div>
                <label className="block text-sm font-medium mb-2">What should they do?</label>
                <textarea
                  value={task}
                  onChange={e => setTask(e.target.value)}
                  placeholder="Describe the task..."
                  className="input min-h-[100px] resize-none"
                  rows={3}
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <div className="flex gap-2">
                  {['k2p5', 'k2.5', 'default'].map(m => (
                    <button
                      key={m}
                      onClick={() => setModel(m)}
                      className={`btn flex-1 ${model === m ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--rar-border)]">
            <button
              onClick={spawnAgent}
              disabled={!task.trim() || (selectedTemplate === 'custom' && !customSoul.name)}
              className="btn btn-primary w-full py-3"
            >
              <Sparkles size={18} /> Forge & Spawn Agent
            </button>
          </div>
        </div>
      )}

      {/* Agents List */}
      {subagents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Zap size={28} />
          </div>
          <h3 className="text-lg font-medium mb-1">No sub-agents</h3>
          <p className="text-sm text-[var(--rar-text-muted)]">Forge a soul and spawn your first agent</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {subagents.map((agent, idx) => (
            <div key={idx} className="card overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-sm text-[var(--rar-accent)] truncate">
                        {agent.key || agent.id || `agent-${idx}`}
                      </div>
                      {agent.label && (
                        <span className="text-xs text-[var(--rar-text-muted)] truncate max-w-[150px]">
                          {agent.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="badge-success">Running</span>
                      {agent.model && <span className="badge-neutral">{agent.model}</span>}
                      {agent.age && (
                        <span className="flex items-center gap-1 text-xs text-[var(--rar-text-muted)]">
                          <Clock size={12} /> {agent.age}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => toggleExpand(agent.key || agent.id)}
                      className="btn btn-ghost p-2"
                    >
                      {expandedAgent === (agent.key || agent.id) ? 
                        <ChevronUp size={16} /> : <ChevronDown size={16} />
                      }
                    </button>
                    <button 
                      onClick={() => killAgent(agent.key || agent.id)}
                      className="btn btn-ghost p-2 text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {expandedAgent === (agent.key || agent.id) && (
                  <div className="mt-4 pt-4 border-t border-[var(--rar-border)]">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-[var(--rar-text-muted)]">Tokens</div>
                        <div>{agent.totalTokens?.toLocaleString() || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[var(--rar-text-muted)]">Kind</div>
                        <div className="capitalize">{agent.kind || 'subagent'}</div>
                      </div>
                    </div>
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

export default SubAgents
