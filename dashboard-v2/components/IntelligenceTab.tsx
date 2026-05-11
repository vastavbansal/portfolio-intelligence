'use client'

import { useState, useEffect } from 'react'
import { DashboardData, ForecastSession } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props { data: DashboardData }

type IntelTab = 'briefings' | 'forecast-track' | 'sessions'

export default function IntelligenceTab({ data }: Props) {
  const [activeTab, setActiveTab] = useState<IntelTab>('briefings')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'morning' | 'eod'>('morning')
  const [briefingContent, setBriefingContent] = useState<string>('')
  const [loadingBriefing, setLoadingBriefing] = useState(false)

  const { sessions, briefingDates } = data

  // Load briefing when date/type changes
  useEffect(() => {
    if (!selectedDate) {
      // Default to most recent morning brief
      const latest = briefingDates.find(b => b.type === 'morning') || briefingDates[0]
      if (latest) { setSelectedDate(latest.date); setSelectedType(latest.type) }
      return
    }
    const fetchBriefing = async () => {
      setLoadingBriefing(true)
      try {
        const res = await fetch(`/api/briefing?date=${selectedDate}&type=${selectedType}`)
        if (res.ok) {
          const d = await res.json()
          setBriefingContent(d.content || '')
        } else setBriefingContent('')
      } catch { setBriefingContent('') }
      finally { setLoadingBriefing(false) }
    }
    fetchBriefing()
  }, [selectedDate, selectedType])

  // Forecast accuracy data
  const scoredSessions = sessions.filter(s =>
    s.session_direction_accuracy?.grade && s.session_direction_accuracy.grade !== 'PENDING' && s.session_direction_accuracy.grade !== 'N/A_HOLIDAY'
  )
  const sdCorrect = scoredSessions.filter(s => s.session_direction_accuracy?.grade === 'CORRECT').length
  const sdPartial = scoredSessions.filter(s => s.session_direction_accuracy?.grade === 'PARTIAL_CORRECT').length
  const sdWrong = scoredSessions.filter(s => s.session_direction_accuracy?.grade === 'WRONG').length

  const obScored = sessions.filter(s => s.opening_bias_actual?.direction_correct !== undefined && s.opening_bias_actual?.direction_correct !== null && !s.opening_bias_actual?.validation_required)
  const obCorrect = obScored.filter(s => s.opening_bias_actual?.direction_correct === true).length

  const accuracyChartData = [
    { name: 'Correct', value: sdCorrect, fill: '#10b981' },
    { name: 'Partial', value: sdPartial, fill: '#f59e0b' },
    { name: 'Wrong', value: sdWrong, fill: '#ef4444' },
  ]

  // Get unique dates from briefings
  const uniqueDates = [...new Set(briefingDates.map(b => b.date))].slice(0, 30)

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
        {(['briefings', 'forecast-track', 'sessions'] as IntelTab[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === t ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            style={activeTab === t ? { background: 'var(--bg-elevated)' } : {}}>
            {t === 'briefings' ? '📄 Briefings' : t === 'forecast-track' ? '📊 Forecast Track' : '📅 Sessions'}
          </button>
        ))}
      </div>

      {/* ── BRIEFINGS ── */}
      {activeTab === 'briefings' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Sidebar: date list */}
          <div className="xl:col-span-1 rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
            <div className="p-3 border-b" style={{ borderColor: 'var(--bg-border)' }}>
              <div className="flex gap-1">
                {(['morning', 'eod'] as const).map(t => (
                  <button key={t} onClick={() => setSelectedType(t)}
                    className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${selectedType === t ? 'text-white' : 'text-slate-500'}`}
                    style={selectedType === t ? { background: 'var(--bg-elevated)' } : {}}>
                    {t === 'morning' ? '🌅 Morning' : '🌙 EOD'}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              {uniqueDates.map(date => {
                const hasMorning = briefingDates.some(b => b.date === date && b.type === 'morning')
                const hasEod = briefingDates.some(b => b.date === date && b.type === 'eod')
                const hasSelected = selectedType === 'morning' ? hasMorning : hasEod
                if (!hasSelected) return null
                return (
                  <button key={date} onClick={() => setSelectedDate(date)}
                    className={`w-full text-left px-3 py-2.5 border-b text-xs transition-all ${selectedDate === date ? 'text-white' : 'hover:text-white text-slate-400'}`}
                    style={{ borderColor: 'var(--bg-border)', background: selectedDate === date ? 'var(--bg-elevated)' : 'transparent' }}>
                    <span className="font-semibold">{date}</span>
                    <div className="flex gap-1 mt-0.5">
                      {hasMorning && <span className="text-blue-400">🌅</span>}
                      {hasEod && <span className="text-purple-400">🌙</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main: briefing content */}
          <div className="xl:col-span-3 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--bg-border)' }}>
              <div>
                <p className="font-semibold text-white text-sm">{selectedDate ? `${selectedType === 'morning' ? '🌅 Morning' : '🌙 EOD'} Brief — ${selectedDate}` : 'Select a briefing'}</p>
              </div>
              {loadingBriefing && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
            </div>
            <div className="p-4 overflow-y-auto max-h-[600px]">
              {briefingContent
                ? <BriefingRenderer content={briefingContent} />
                : <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
                    {loadingBriefing ? 'Loading…' : 'Select a briefing from the left'}
                  </p>
              }
            </div>
          </div>
        </div>
      )}

      {/* ── FORECAST TRACK ── */}
      {activeTab === 'forecast-track' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <TrackCard title="Session Direction" subtitle="Total scored" value={scoredSessions.length} />
            <TrackCard title="Correct" value={sdCorrect} total={scoredSessions.length} color="#10b981" />
            <TrackCard title="Partial" value={sdPartial} total={scoredSessions.length} color="#f59e0b" />
            <TrackCard title="Wrong" value={sdWrong} total={scoredSessions.length} color="#ef4444" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chart */}
            <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
              <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>SESSION DIRECTION DISTRIBUTION</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={accuracyChartData}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {accuracyChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Opening Bias track */}
            <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
              <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>OPENING BIAS TRACK</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{obScored.length} scored · {obCorrect} correct ({obScored.length ? ((obCorrect/obScored.length)*100).toFixed(0) : 0}%)</p>
              <div className="space-y-2">
                {sessions.filter(s => s.opening_bias).slice(0, 8).map(s => {
                  const oba = s.opening_bias_actual
                  const correct = oba?.direction_correct
                  const isEst = oba?.pre_estimated_by || oba?.validation_required
                  return (
                    <div key={s.session_date} className="flex items-center gap-2 text-xs">
                      <span className="w-16 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{s.session_date.slice(5)}</span>
                      <span className="flex-1" style={{ color: 'var(--text-secondary)' }}>{s.opening_bias?.direction?.replace(/_/g, ' ')}</span>
                      {oba && !isEst
                        ? <span className={correct ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>{correct ? '✓' : '✗'} {oba.grade}</span>
                        : oba && isEst
                        ? <span className="text-slate-500 italic">~est</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>
                      }
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SESSIONS TABLE ── */}
      {activeTab === 'sessions' && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  <th className="text-left py-2.5 px-3 font-medium">DATE</th>
                  <th className="text-left py-2.5 px-3 font-medium hidden sm:table-cell">REGIME</th>
                  <th className="text-center py-2.5 px-3 font-medium">OB FORECAST</th>
                  <th className="text-center py-2.5 px-3 font-medium">OB ACTUAL</th>
                  <th className="text-center py-2.5 px-3 font-medium">SESSION FORECAST</th>
                  <th className="text-center py-2.5 px-3 font-medium">SESSION GRADE</th>
                  <th className="text-left py-2.5 px-3 font-medium hidden lg:table-cell">KEY LESSON</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => {
                  const sdGrade = typeof s.session_direction_accuracy === 'object' ? s.session_direction_accuracy?.grade : s.session_direction_accuracy
                  const gradeColor = sdGrade === 'CORRECT' ? '#10b981' : sdGrade === 'PARTIAL_CORRECT' ? '#f59e0b' : sdGrade === 'WRONG' ? '#ef4444' : sdGrade === 'N/A_HOLIDAY' ? '#64748b' : '#3b82f6'
                  return (
                    <tr key={s.session_date} className="border-t card-hover" style={{ borderColor: 'var(--bg-border)' }}>
                      <td className="py-2 px-3 font-mono font-semibold text-white">{s.session_date}</td>
                      <td className="py-2 px-3 hidden sm:table-cell max-w-xs">
                        <span className="truncate block text-xs" style={{ color: 'var(--text-secondary)' }}>{s.forecast_regime?.replace(/_/g, ' ').slice(0, 25)}</span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <DirectionChip dir={s.opening_bias?.direction} />
                      </td>
                      <td className="py-2 px-3 text-center">
                        {s.opening_bias_actual
                          ? <span className={`font-semibold ${s.opening_bias_actual.direction_correct ? 'text-emerald-400' : 'text-red-400'}`}>
                              {s.opening_bias_actual.direction_correct ? '✓' : '✗'} {s.opening_bias_actual.direction?.replace(/_/g, ' ')}
                            </span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>
                        }
                      </td>
                      <td className="py-2 px-3 text-center">
                        <DirectionChip dir={typeof s.session_direction === 'object' ? s.session_direction?.direction : undefined} />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="font-semibold text-xs px-2 py-0.5 rounded-full" style={{ background: `${gradeColor}22`, color: gradeColor }}>
                          {sdGrade || '—'}
                        </span>
                      </td>
                      <td className="py-2 px-3 hidden lg:table-cell max-w-xs">
                        <span className="truncate block text-xs" style={{ color: 'var(--text-muted)' }}>{s.lessons?.[0]?.slice(0, 60) || '—'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function TrackCard({ title, subtitle, value, total, color }: { title: string; subtitle?: string; value: number; total?: number; color?: string }) {
  const pct = total ? ((value / total) * 100).toFixed(0) : null
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
      <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{title.toUpperCase()}</p>
      {subtitle && <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold" style={{ color: color || 'white' }}>{value}</span>
        {pct && <span className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>({pct}%)</span>}
      </div>
    </div>
  )
}

function DirectionChip({ dir }: { dir?: string }) {
  if (!dir) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  const isUp = dir.includes('UP') || dir.includes('BULL') || dir.includes('FLAT_TO_SLIGHT_GAP_UP')
  const isDown = dir.includes('DOWN') || dir.includes('BEAR')
  const color = isUp ? '#10b981' : isDown ? '#ef4444' : '#f59e0b'
  return <span className="text-xs font-semibold" style={{ color }}>{isUp ? '▲' : isDown ? '▼' : '●'} {dir.replace(/_/g, ' ').slice(0, 12)}</span>
}

function BriefingRenderer({ content }: { content: string }) {
  const [html, setHtml] = useState('')
  useEffect(() => {
    import('marked').then(({ marked }) => {
      setHtml(marked.parse(content) as string)
    })
  }, [content])
  return <div className="briefing-content" dangerouslySetInnerHTML={{ __html: html }} />
}
