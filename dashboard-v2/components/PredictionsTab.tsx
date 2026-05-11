'use client'

import { useState, useMemo } from 'react'
import { DashboardData, Prediction, PredictionStatus } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

interface Props { data: DashboardData }
type FilterStatus = 'ALL' | PredictionStatus | 'OPEN'
type SortField = 'date' | 'check_date' | 'confidence' | 'pred_id'

export default function PredictionsTab({ data }: Props) {
  const { predictions, accuracyMeta } = data
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')
  const [filterHorizon, setFilterHorizon] = useState('ALL')
  const [filterConf, setFilterConf] = useState(0)
  const [sortBy, setSortBy] = useState<SortField>('check_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')

  const l1 = accuracyMeta?.L1_scorecard?.all_time
  const horizons = [...new Set(predictions.map(p => p.horizon))].sort()

  const filtered = useMemo(() => {
    return predictions.filter(p => {
      const status = p.outcome || 'OPEN'
      if (filterStatus !== 'ALL' && status !== filterStatus) return false
      if (filterHorizon !== 'ALL' && p.horizon !== filterHorizon) return false
      if (filterConf > 0 && p.confidence < filterConf) return false
      if (searchText && !`${p.pred_id} ${p.stock} ${p.prediction}`.toLowerCase().includes(searchText.toLowerCase())) return false
      return true
    }).sort((a, b) => {
      let av: any = a[sortBy as keyof Prediction]
      let bv: any = b[sortBy as keyof Prediction]
      if (sortBy === 'pred_id') { av = parseInt(av?.replace(/\D/g, '') || '0'); bv = parseInt(bv?.replace(/\D/g, '') || '0') }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [predictions, filterStatus, filterHorizon, filterConf, sortBy, sortDir, searchText])

  // Chart data
  const byHorizon = horizons.map(h => {
    const ps = predictions.filter(p => p.horizon === h)
    const scored = ps.filter(p => p.outcome)
    const right = scored.filter(p => ['RIGHT', 'CORRECT'].includes(p.outcome || '')).length
    return { name: h, total: ps.length, scored: scored.length, right, acc: scored.length ? Math.round(right/scored.length*100) : 0 }
  })

  const byConfidence = [1,2,3,4,5].map(c => {
    const ps = predictions.filter(p => p.confidence === c && p.outcome)
    const right = ps.filter(p => ['RIGHT', 'CORRECT'].includes(p.outcome || '')).length
    return { name: `⭐${c}`, total: ps.length, right, acc: ps.length ? Math.round(right/ps.length*100) : 0 }
  }).filter(d => d.total > 0)

  const statusCounts = {
    OPEN: predictions.filter(p => !p.outcome).length,
    RIGHT: predictions.filter(p => ['RIGHT', 'CORRECT'].includes(p.outcome || '')).length,
    WRONG: predictions.filter(p => p.outcome === 'WRONG').length,
    PARTIAL: predictions.filter(p => ['PARTIAL_CORRECT', 'PARTIAL', 'ABOVE_RANGE'].includes(p.outcome || '')).length,
  }

  const toggle = (field: SortField) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('asc') }
  }

  return (
    <div className="space-y-4">
      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'ACCURACY', value: `${l1?.accuracy_pct?.toFixed(1) || 0}%`, sub: `${l1?.right || 0}/${l1?.scored || 0} scored`, color: (l1?.accuracy_pct || 0) >= 40 ? '#10b981' : '#ef4444' },
          { label: 'OPEN', value: statusCounts.OPEN, sub: 'tracking now', color: '#3b82f6' },
          { label: 'RIGHT', value: statusCounts.RIGHT, sub: `${l1?.right || 0} all-time`, color: '#10b981' },
          { label: 'WRONG', value: statusCounts.WRONG, sub: 'for learning', color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-4 cursor-pointer card-hover"
            onClick={() => setFilterStatus(s.label as FilterStatus)}
            style={{ background: 'var(--bg-card)', borderColor: filterStatus === s.label ? s.color : 'var(--bg-border)' }}>
            <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Analytics Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>ACCURACY BY HORIZON</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={byHorizon}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 11 }}
                formatter={(v: any) => [`${v}%`, 'Accuracy']} />
              <Bar dataKey="acc" radius={[3,3,0,0]}>
                {byHorizon.map((e, i) => <Cell key={i} fill={e.acc >= 40 ? '#10b981' : e.acc >= 20 ? '#f59e0b' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>ACCURACY BY CONFIDENCE</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={byConfidence}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 11 }}
                formatter={(v: any) => [`${v}%`, 'Accuracy']} />
              <Bar dataKey="acc" radius={[3,3,0,0]}>
                {byConfidence.map((e, i) => <Cell key={i} fill={e.acc >= 40 ? '#10b981' : e.acc >= 20 ? '#f59e0b' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Key insight: {byConfidence.length > 0 ? `High-confidence (4-5⭐) vs low-confidence accuracy gap` : 'Not enough data yet'}
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search predictions…"
          className="px-3 py-1.5 text-xs rounded-lg outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'white', width: '180px' }} />
        <FilterChips label="Status" options={['ALL', 'OPEN', 'RIGHT', 'WRONG', 'PARTIAL_CORRECT']}
          value={filterStatus} onChange={v => setFilterStatus(v as FilterStatus)} />
        <FilterChips label="Horizon" options={['ALL', ...horizons]}
          value={filterHorizon} onChange={setFilterHorizon} />
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Min ⭐</span>
          {[0,1,2,3,4].map(c => (
            <button key={c} onClick={() => setFilterConf(c)}
              className={`w-6 h-6 text-xs rounded font-semibold transition-all ${filterConf === c ? 'text-white' : 'text-slate-500'}`}
              style={{ background: filterConf === c ? '#3b82f6' : 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
              {c === 0 ? '∀' : c}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>{filtered.length} predictions</span>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                {[
                  { label: 'ID', field: 'pred_id' },
                  { label: 'STOCK', field: null },
                  { label: 'PREDICTION', field: null },
                  { label: 'CONF', field: 'confidence' },
                  { label: 'HORIZON', field: null },
                  { label: 'CHECK', field: 'check_date' },
                  { label: 'STATUS', field: null },
                  { label: '', field: null },
                ].map((col, i) => (
                  <th key={i} className={`text-left py-2.5 px-3 font-medium ${col.field ? 'cursor-pointer hover:text-white' : ''}`}
                    onClick={() => col.field && toggle(col.field as SortField)}>
                    {col.label} {col.field && sortBy === col.field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const status = p.outcome || 'OPEN'
                const isExpanded = expandedId === p.pred_id
                const statusColor = status === 'OPEN' ? '#3b82f6' : ['RIGHT','CORRECT'].includes(status) ? '#10b981' : status === 'WRONG' ? '#ef4444' : '#f59e0b'
                const daysLeft = p.check_date ? Math.ceil((new Date(p.check_date).getTime() - Date.now()) / 86400000) : null
                return (
                  <>
                    <tr key={p.pred_id} className={`border-t card-hover ${isExpanded ? '' : ''}`}
                      style={{ borderColor: 'var(--bg-border)', background: isExpanded ? 'var(--bg-elevated)' : 'transparent' }}>
                      <td className="py-2 px-3 font-mono font-bold text-blue-400">{p.pred_id}</td>
                      <td className="py-2 px-3 font-semibold text-white whitespace-nowrap">{p.stock}</td>
                      <td className="py-2 px-3 max-w-xs">
                        <span className="truncate block" style={{ color: 'var(--text-secondary)' }}>{p.prediction?.slice(0, 65)}</span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= p.confidence ? 'bg-blue-400' : 'bg-slate-700'}`} />)}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{p.horizon}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={daysLeft !== null && daysLeft <= 2 && status === 'OPEN' ? 'text-red-400 font-semibold' : daysLeft !== null && daysLeft <= 7 && status === 'OPEN' ? 'text-yellow-400' : ''} style={{ color: daysLeft !== null && daysLeft <= 7 ? undefined : 'var(--text-secondary)' }}>
                          {p.check_date}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="badge" style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}>{status}</span>
                      </td>
                      <td className="py-2 px-3">
                        <button onClick={() => setExpandedId(isExpanded ? null : p.pred_id)}
                          className="text-slate-500 hover:text-white transition-colors px-2">
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background: 'var(--bg-elevated)' }}>
                        <td colSpan={8} className="px-4 py-3">
                          <PredictionExpanded p={p} />
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No predictions match filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PredictionExpanded({ p }: { p: Prediction }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
      <div>
        <p className="font-semibold text-white mb-1">Full Thesis</p>
        <p style={{ color: 'var(--text-secondary)' }}>{p.prediction}</p>
        <p className="font-semibold text-white mt-2 mb-1">Reasoning</p>
        <p style={{ color: 'var(--text-secondary)' }}>{p.reasoning}</p>
      </div>
      <div>
        <p className="font-semibold text-white mb-1">Factors Checked ✓</p>
        <ul className="space-y-0.5">
          {(p.factors_checked || []).map((f, i) => <li key={i} className="text-emerald-400">✓ {f}</li>)}
        </ul>
        {(p.factors_not_checked || []).length > 0 && <>
          <p className="font-semibold text-white mt-2 mb-1">Not Checked ✗</p>
          <ul className="space-y-0.5">
            {p.factors_not_checked.map((f, i) => <li key={i} className="text-red-400">✗ {f}</li>)}
          </ul>
        </>}
      </div>
      <div>
        {p.outcome && <>
          <p className="font-semibold text-white mb-1">Outcome</p>
          <p style={{ color: 'var(--text-secondary)' }}>{p.outcome_evidence}</p>
        </>}
        {p.postmortem && <>
          <p className="font-semibold text-yellow-400 mt-2 mb-1">🔬 Postmortem</p>
          <p style={{ color: 'var(--text-secondary)' }}>{p.postmortem}</p>
        </>}
        <div className="flex gap-2 mt-2 flex-wrap">
          {p.entry_price && <span className="badge" style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>Entry ₹{p.entry_price}</span>}
          {p.outcome_price && <span className="badge" style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>Outcome ₹{p.outcome_price}</span>}
          <span className="badge" style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>Category: {p.category}</span>
        </div>
      </div>
    </div>
  )
}

function FilterChips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>{label}:</span>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className={`px-2 py-1 text-xs rounded font-medium transition-all ${value === o ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          style={{ background: value === o ? '#3b82f6' : 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
          {o}
        </button>
      ))}
    </div>
  )
}
