'use client'

import { useState, useRef } from 'react'
import { DashboardData, ChangelogEntry } from '@/lib/types'

interface Props {
  data: DashboardData
  changelog: ChangelogEntry[]
  onRefresh: () => void
}

const CATEGORIES = ['ALL', 'TRADE', 'FORECAST', 'SYSTEM', 'LESSON', 'RISK'] as const
const SOURCES = ['ALL', 'auto', 'manual'] as const

const categoryColor = (cat: string) => {
  switch (cat) {
    case 'TRADE': return { bg: '#10b98122', color: '#10b981', border: '#10b98144' }
    case 'FORECAST': return { bg: '#3b82f622', color: '#3b82f6', border: '#3b82f644' }
    case 'SYSTEM': return { bg: '#8b5cf622', color: '#8b5cf6', border: '#8b5cf644' }
    case 'LESSON': return { bg: '#f59e0b22', color: '#f59e0b', border: '#f59e0b44' }
    case 'RISK': return { bg: '#ef444422', color: '#ef4444', border: '#ef444444' }
    default: return { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: 'var(--bg-border)' }
  }
}

const impactColor = (impact: string) => {
  const l = (impact || '').toUpperCase()
  if (l.includes('HIGH') || l.includes('MAJOR')) return '#10b981'
  if (l.includes('MED')) return '#f59e0b'
  if (l.includes('LOW') || l.includes('MINOR')) return '#6b7280'
  return '#3b82f6'
}

function ChangelogCard({ entry }: { entry: ChangelogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const catStyle = categoryColor(entry.category)

  return (
    <div className="rounded-xl border transition-all" style={{ background: 'var(--bg-card)', borderColor: catStyle.border }}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="badge font-semibold" style={{ background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}>
              {entry.category}
            </span>
            {entry.source === 'auto' && (
              <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>⚡ Auto</span>
            )}
            {entry.source === 'manual' && (
              <span className="badge" style={{ background: '#7c3aed22', color: '#a78bfa', border: '1px solid #7c3aed44' }}>✍️ Manual</span>
            )}
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{entry.date}</span>
            {entry.impact && (
              <span className="text-xs font-semibold" style={{ color: impactColor(entry.impact) }}>
                ● {entry.impact}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-white leading-snug">{entry.title}</p>
          {!expanded && entry.what_happened && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{entry.what_happened}</p>
          )}
        </div>
        <span className="text-slate-500 text-xs mt-0.5 flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--bg-border)' }}>
          {entry.what_happened && (
            <div className="pt-3">
              <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>WHAT HAPPENED</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{entry.what_happened}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entry.what_to_do && entry.what_to_do.length > 0 && (
              <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-xs font-semibold tracking-widest mb-2 text-emerald-400">✓ WHAT TO DO</p>
                <ul className="space-y-1">
                  {entry.what_to_do.map((item, i) => (
                    <li key={i} className="text-xs flex gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <span className="text-emerald-500 flex-shrink-0">›</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {entry.what_not_to_do && entry.what_not_to_do.length > 0 && (
              <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-xs font-semibold tracking-widest mb-2 text-red-400">✗ WHAT NOT TO DO</p>
                <ul className="space-y-1">
                  {entry.what_not_to_do.map((item, i) => (
                    <li key={i} className="text-xs flex gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <span className="text-red-500 flex-shrink-0">›</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {entry.pnl_impact !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>P&L IMPACT</span>
              <span className={`text-sm font-bold ${entry.pnl_impact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {entry.pnl_impact >= 0 ? '+' : ''}₹{Math.abs(entry.pnl_impact).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}

          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.map((tag, i) => (
                <span key={i} className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AddEntryModal({ onClose, onSave }: { onClose: () => void; onSave: (entry: Partial<ChangelogEntry>) => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    category: 'LESSON',
    impact: 'MEDIUM',
    what_happened: '',
    what_to_do: '',
    what_not_to_do: '',
    tags: '',
  })

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await onSave({
        title: form.title,
        category: form.category as any,
        impact: form.impact,
        what_happened: form.what_happened,
        what_to_do: form.what_to_do.split('\n').filter(Boolean),
        what_not_to_do: form.what_not_to_do.split('\n').filter(Boolean),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        source: 'manual',
        date: new Date().toISOString().split('T')[0],
      })
      onClose()
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--bg-border)' }}>
          <h2 className="font-bold text-white">Add War Room Entry</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold tracking-widest mb-1 block" style={{ color: 'var(--text-muted)' }}>TITLE *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What happened in one line..."
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold tracking-widest mb-1 block" style={{ color: 'var(--text-muted)' }}>CATEGORY</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                {['TRADE', 'FORECAST', 'SYSTEM', 'LESSON', 'RISK'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold tracking-widest mb-1 block" style={{ color: 'var(--text-muted)' }}>IMPACT</label>
              <select value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                {['HIGH', 'MEDIUM', 'LOW'].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest mb-1 block" style={{ color: 'var(--text-muted)' }}>WHAT HAPPENED</label>
            <textarea value={form.what_happened} onChange={e => setForm(f => ({ ...f, what_happened: e.target.value }))}
              rows={3} placeholder="Describe the event, decision, or outcome..."
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }} />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest mb-1 block text-emerald-400">✓ WHAT TO DO (one per line)</label>
            <textarea value={form.what_to_do} onChange={e => setForm(f => ({ ...f, what_to_do: e.target.value }))}
              rows={3} placeholder="Next time, do this..."
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid #10b98144' }} />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest mb-1 block text-red-400">✗ WHAT NOT TO DO (one per line)</label>
            <textarea value={form.what_not_to_do} onChange={e => setForm(f => ({ ...f, what_not_to_do: e.target.value }))}
              rows={3} placeholder="Avoid this mistake..."
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid #ef444444' }} />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest mb-1 block" style={{ color: 'var(--text-muted)' }}>TAGS (comma-separated)</label>
            <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="nifty, earnings, stop-loss..."
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }} />
          </div>
        </div>

        <div className="p-4 border-t flex gap-2 justify-end" style={{ borderColor: 'var(--bg-border)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !form.title.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#3b82f6' }}>
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ChangelogTab({ data, changelog, onRefresh }: Props) {
  const [catFilter, setCatFilter] = useState<string>('ALL')
  const [srcFilter, setSrcFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const filtered = changelog.filter(e => {
    if (catFilter !== 'ALL' && e.category !== catFilter) return false
    if (srcFilter !== 'ALL' && e.source !== srcFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return e.title?.toLowerCase().includes(q) ||
        e.what_happened?.toLowerCase().includes(q) ||
        e.tags?.some(t => t.toLowerCase().includes(q))
    }
    return true
  }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const handleSave = async (entry: Partial<ChangelogEntry>) => {
    const res = await fetch('/api/changelog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setSaveError(err.error || 'Failed to save — is Supabase configured?')
      throw new Error('save failed')
    }
    onRefresh()
  }

  // Stats
  const autoCount = changelog.filter(e => e.source === 'auto').length
  const manualCount = changelog.filter(e => e.source === 'manual').length
  const lessonCount = changelog.filter(e => e.category === 'LESSON').length
  const tradeCount = changelog.filter(e => e.category === 'TRADE').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">⚔️ War Room</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Every trade, forecast, lesson — documented and distilled.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white w-fit"
          style={{ background: '#3b82f6' }}>
          + Add Entry
        </button>
      </div>

      {saveError && (
        <div className="p-3 rounded-lg border border-red-900 bg-red-950/20 text-red-400 text-xs flex items-center justify-between">
          <span>{saveError}</span>
          <button onClick={() => setSaveError(null)} className="text-red-600 hover:text-red-400 ml-2">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'TOTAL ENTRIES', val: changelog.length, color: 'white' },
          { label: 'AUTO-GENERATED', val: autoCount, color: '#3b82f6' },
          { label: 'MANUAL ENTRIES', val: manualCount, color: '#a78bfa' },
          { label: 'LESSONS LOGGED', val: lessonCount, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
            <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category filter */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${catFilter === c ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              style={catFilter === c ? { background: 'var(--bg-elevated)' } : {}}>
              {c}
            </button>
          ))}
        </div>

        {/* Source filter */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
          {SOURCES.map(s => (
            <button key={s} onClick={() => setSrcFilter(s)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${srcFilter === s ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              style={srcFilter === s ? { background: 'var(--bg-elevated)' } : {}}>
              {s === 'auto' ? '⚡ Auto' : s === 'manual' ? '✍️ Manual' : 'ALL'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 min-w-32">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search entries…"
            className="w-full px-3 py-1.5 rounded-lg text-xs text-white outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }} />
        </div>

        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{filtered.length} entries</span>
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {changelog.length === 0 ? 'No entries yet. Start logging your first War Room entry.' : 'No entries match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry, i) => (
            <ChangelogCard key={entry.id || `${entry.date}-${i}`} entry={entry} />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && <AddEntryModal onClose={() => setShowAdd(false)} onSave={handleSave} />}
    </div>
  )
}
