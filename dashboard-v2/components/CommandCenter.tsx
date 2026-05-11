'use client'

import { DashboardData } from '@/lib/types'
import { RadialBarChart, RadialBar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts'

interface Props { data: DashboardData; onTabChange: (tab: string) => void }

export default function CommandCenter({ data, onTabChange }: Props) {
  const { context, predictions, actions, sessions, accuracyMeta, prices } = data
  const regime = context?.market_regime
  const nifty = prices?.indices?.NIFTY_50
  const brent = prices?.commodities?.BRENT

  const openPredictions = predictions.filter(p => !p.outcome || p.outcome === null)
  const urgentActions = actions.filter(a => a.status === 'ACTIVE' && a.urgency === 'IMMEDIATE')
  const thisWeekActions = actions.filter(a => a.status === 'ACTIVE' && a.urgency === 'THIS_WEEK')

  const l1 = accuracyMeta?.L1_scorecard?.all_time
  const accuracy = l1?.accuracy_pct || 0
  const scored = l1?.scored || 0

  // Upcoming prediction check dates (next 7 days)
  const today = new Date()
  const in7days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcoming = openPredictions
    .filter(p => p.check_date && new Date(p.check_date) <= in7days)
    .sort((a, b) => a.check_date.localeCompare(b.check_date))
    .slice(0, 5)

  // Recent sessions for mini chart
  const recentSessions = [...sessions].reverse().slice(-10)
  const sessionChartData = recentSessions.map(s => ({
    date: s.session_date.slice(5),
    correct: s.session_direction_accuracy?.grade === 'CORRECT' ? 1 : s.session_direction_accuracy?.grade === 'PARTIAL_CORRECT' ? 0.5 : s.session_direction_accuracy?.grade === 'WRONG' ? 0 : null,
    label: s.session_direction_accuracy?.grade,
  })).filter(d => d.correct !== null)

  // Today's forecast
  const todaySession = sessions.find(s => s.session_date === new Date().toISOString().slice(0, 10))
  const tomorrowForecast = context?.tomorrow_forecast

  return (
    <div className="space-y-4">
      {/* ── ROW 1: Regime + Key Metrics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Regime Card */}
        <div className="lg:col-span-2 rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>CURRENT REGIME</p>
              <h2 className="text-lg font-bold text-white leading-tight">{regime?.label?.replace(/_/g, ' ') || '—'}</h2>
              {regime?.regime_since && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Since {regime.regime_since.slice(0, 10)}</p>}
            </div>
            <RegimeSeverityBadge label={regime?.label || ''} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <MetricMini label="KEY RISK" value={regime?.key_risk?.slice(0, 40) || '—'} small />
            <MetricMini label="BRENT" value={brent ? `$${brent.price}` : regime ? `$${regime.crude_last}` : '—'}
              delta={brent?.change_pct || 0} unit="$/bbl" />
            <MetricMini label="NIFTY SUPPORT" value={regime?.nifty_key_support ? `₹${regime.nifty_key_support.toLocaleString('en-IN')}` : '—'} />
            <MetricMini label="NIFTY RESIST." value={regime?.nifty_key_resistance ? `₹${regime.nifty_key_resistance.toLocaleString('en-IN')}` : '—'} />
          </div>

          {regime?.dominant_risk && (
            <div className="mt-3 p-2.5 rounded-lg text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              ⚠️ {regime.dominant_risk.slice(0, 150)}
            </div>
          )}
        </div>

        {/* Accuracy Scorecard */}
        <div className="rounded-xl border p-4 flex flex-col" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>PREDICTION SCORECARD</p>
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-shrink-0 w-20 h-20">
              <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
                <circle cx="40" cy="40" r="32" fill="none"
                  stroke={accuracy >= 40 ? '#10b981' : accuracy >= 25 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray={`${(accuracy / 100) * 201} 201`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white">{accuracy.toFixed(0)}%</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>acc</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <ScoreLine label="Total" value={l1?.total || 0} color="text-slate-400" />
              <ScoreLine label="Open" value={l1?.open || 0} color="text-blue-400" />
              <ScoreLine label="Right" value={l1?.right || 0} color="text-emerald-400" />
              <ScoreLine label="Wrong" value={l1?.wrong || 0} color="text-red-400" />
              <ScoreLine label="Partial" value={l1?.partial || 0} color="text-yellow-400" />
            </div>
          </div>
          <button onClick={() => onTabChange('predictions')}
            className="mt-3 text-xs text-center py-1.5 rounded-lg transition-all hover:text-white"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
            View Prediction Lab →
          </button>
        </div>
      </div>

      {/* ── ROW 2: Today's Forecast + Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">

        {/* Today's Opening Bias */}
        <ForecastCard
          title="TODAY'S OPENING BIAS"
          forecast={todaySession?.opening_bias || context?.opening_bias}
          actual={todaySession?.opening_bias_actual || context?.opening_bias_actual}
          type="opening"
        />

        {/* Today's Session Direction */}
        <ForecastCard
          title="SESSION DIRECTION"
          forecast={todaySession?.session_direction || context?.session_direction}
          accuracy={todaySession?.session_direction_accuracy}
          type="session"
        />

        {/* Priority Actions */}
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>ACTIVE ACTIONS</p>
            <span className="badge" style={{ background: urgentActions.length > 0 ? '#f9731622' : '#10b98122', color: urgentActions.length > 0 ? '#f97316' : '#10b981', border: `1px solid ${urgentActions.length > 0 ? '#f9731644' : '#10b98144'}` }}>
              {urgentActions.length} URGENT
            </span>
          </div>
          <div className="space-y-2">
            {actions.filter(a => a.status === 'ACTIVE').slice(0, 4).map(action => (
              <ActionRow key={action.action_id} action={action} />
            ))}
            {actions.filter(a => a.status === 'ACTIVE').length === 0 && (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>No active actions</p>
            )}
          </div>
          <button onClick={() => onTabChange('portfolio')}
            className="mt-3 w-full text-xs text-center py-1.5 rounded-lg transition-all hover:text-white"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
            View All Actions →
          </button>
        </div>
      </div>

      {/* ── ROW 3: Upcoming Checks + Forecast Track + Open Predictions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">

        {/* Upcoming Prediction Checks */}
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>CHECKS DUE THIS WEEK</p>
          {upcoming.length === 0
            ? <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>No checks due</p>
            : upcoming.map(p => (
              <div key={p.pred_id} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'var(--bg-border)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <ConfidenceDot level={p.confidence} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{p.pred_id} · {p.stock}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{p.prediction?.slice(0, 45)}</p>
                  </div>
                </div>
                <span className="text-xs ml-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{p.check_date?.slice(5)}</span>
              </div>
            ))
          }
        </div>

        {/* Mini Forecast Accuracy Chart */}
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>SESSION DIRECTION TRACK</p>
            <button onClick={() => onTabChange('intelligence')} className="text-xs hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>View →</button>
          </div>
          {sessionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={sessionChartData}>
                <Line type="monotone" dataKey="correct" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                <ReferenceLine y={0.5} stroke="#1a2d4a" strokeDasharray="3 3" />
                <Tooltip content={<CustomDot />} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>No scored sessions yet</p>}
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-emerald-400">✓ Correct</span>
            <span className="text-yellow-400">⚡ Partial</span>
            <span className="text-red-400">✗ Wrong</span>
          </div>
        </div>

        {/* Latest Lessons */}
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>RECENT LESSONS</p>
            <button onClick={() => onTabChange('changelog')} className="text-xs hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>War Room →</button>
          </div>
          <div className="space-y-2">
            {sessions.slice(0, 3).flatMap(s => (s.lessons || []).slice(0, 1).map((l, i) => (
              <div key={`${s.session_date}-${i}`} className="text-xs p-2 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                <span className="text-blue-400 mr-1">{s.session_date.slice(5)}</span>{l.slice(0, 80)}
              </div>
            )))}
            {sessions.every(s => !s.lessons?.length) && (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>No lessons recorded yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 4: Open Predictions Quick View ── */}
      <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>OPEN POSITIONS ({openPredictions.length})</p>
          <button onClick={() => onTabChange('predictions')} className="text-xs hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>View Lab →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="text-left py-1.5 px-2 font-medium">ID</th>
                <th className="text-left py-1.5 px-2 font-medium">STOCK</th>
                <th className="text-left py-1.5 px-2 font-medium hidden sm:table-cell">THESIS</th>
                <th className="text-center py-1.5 px-2 font-medium">CONF</th>
                <th className="text-right py-1.5 px-2 font-medium">CHECK DATE</th>
                <th className="text-right py-1.5 px-2 font-medium hidden md:table-cell">HORIZON</th>
              </tr>
            </thead>
            <tbody>
              {openPredictions.slice(0, 10).map(p => {
                const daysLeft = Math.ceil((new Date(p.check_date).getTime() - Date.now()) / 86400000)
                return (
                  <tr key={p.pred_id} className="card-hover border-t" style={{ borderColor: 'var(--bg-border)' }}>
                    <td className="py-1.5 px-2 font-mono font-semibold text-blue-400">{p.pred_id}</td>
                    <td className="py-1.5 px-2 font-semibold text-white">{p.stock}</td>
                    <td className="py-1.5 px-2 hidden sm:table-cell" style={{ color: 'var(--text-secondary)', maxWidth: '280px' }}>
                      <span className="truncate block">{p.prediction?.slice(0, 60)}</span>
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <ConfidencePips level={p.confidence} />
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      <span className={`${daysLeft <= 2 ? 'text-red-400' : daysLeft <= 7 ? 'text-yellow-400' : 'text-slate-400'}`}>
                        {p.check_date?.slice(5)} {daysLeft <= 7 ? `(${daysLeft}d)` : ''}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right hidden md:table-cell">
                      <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{p.horizon}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Sub-components
function MetricMini({ label, value, delta, unit, small }: { label: string; value: string; delta?: number; unit?: string; small?: boolean }) {
  return (
    <div className="rounded-lg p-2.5" style={{ background: 'var(--bg-elevated)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className={`font-semibold ${small ? 'text-xs' : 'text-sm'} text-white leading-tight`}>{value}</p>
      {delta !== undefined && (
        <p className={`text-xs mt-0.5 ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {delta >= 0 ? '+' : ''}{delta.toFixed(2)}%
        </p>
      )}
    </div>
  )
}

function ScoreLine({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  )
}

function ConfidenceDot({ level }: { level: number }) {
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-blue-500']
  return <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[level] || 'bg-slate-500'}`} title={`Confidence: ${level}/5`} />
}

function ConfidencePips({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5 justify-center">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= level ? 'bg-blue-400' : 'bg-slate-700'}`} />
      ))}
    </div>
  )
}

function ActionRow({ action }: { action: any }) {
  const urgencyColor = action.urgency === 'IMMEDIATE' ? 'text-red-400' : action.urgency === 'THIS_WEEK' ? 'text-yellow-400' : 'text-slate-400'
  const typeColor = ['BUY', 'ADD'].includes(action.type) ? 'text-emerald-400' : ['SELL', 'EXIT', 'TRIM'].includes(action.type) ? 'text-red-400' : 'text-blue-400'
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg card-hover" style={{ background: 'var(--bg-elevated)' }}>
      <span className={`text-xs font-bold w-8 ${typeColor}`}>{action.type}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{action.stock}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{action.rationale_short?.slice(0, 45)}</p>
      </div>
      <span className={`text-xs font-semibold ${urgencyColor}`}>{action.urgency?.slice(0, 4)}</span>
    </div>
  )
}

function ForecastCard({ title, forecast, actual, accuracy, type }: any) {
  const direction = forecast?.direction || '—'
  const isUp = direction.includes('UP') || direction.includes('BULL')
  const isDown = direction.includes('DOWN') || direction.includes('BEAR')
  const dirColor = isUp ? '#10b981' : isDown ? '#ef4444' : '#f59e0b'

  const grade = actual?.grade || accuracy?.grade
  const gradeColor = grade === 'CORRECT' ? '#10b981' : grade === 'PARTIAL_CORRECT' || grade === 'PARTIAL' ? '#f59e0b' : grade === 'WRONG' ? '#ef4444' : '#3b82f6'

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>{title}</p>
        {grade && grade !== 'PENDING' && (
          <span className="badge" style={{ background: `${gradeColor}22`, color: gradeColor, border: `1px solid ${gradeColor}44` }}>{grade}</span>
        )}
        {(grade === 'PENDING' || !grade) && (
          <span className="badge" style={{ background: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f644' }}>LIVE</span>
        )}
      </div>
      <div className="flex items-center gap-3 my-3">
        <div className="text-3xl font-bold" style={{ color: dirColor }}>{isUp ? '▲' : isDown ? '▼' : '●'}</div>
        <div>
          <p className="font-bold text-white text-sm">{direction.replace(/_/g, ' ')}</p>
          {forecast?.change_pct_estimate && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{forecast.change_pct_estimate > 0 ? '+' : ''}{forecast.change_pct_estimate}% est.</p>}
          {forecast?.gap_pct_estimate !== undefined && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{forecast.gap_pct_estimate > 0 ? '+' : ''}{forecast.gap_pct_estimate}% gap est.</p>}
        </div>
      </div>
      {forecast?.key_assumption && (
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{forecast.key_assumption.slice(0, 80)}</p>
      )}
      {(forecast?.range_low || forecast?.range_high) && (
        <div className="flex gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
            ₹{forecast.range_low?.toLocaleString('en-IN')} – ₹{forecast.range_high?.toLocaleString('en-IN')}
          </span>
          {forecast.confidence && <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>⭐ {forecast.confidence}/5</span>}
        </div>
      )}
      {actual && actual.direction && (
        <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: 'var(--bg-elevated)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Actual: </span>
          <span className={actual.direction_correct ? 'text-emerald-400' : 'text-red-400'}>{actual.direction}</span>
          {actual.gap_pct !== undefined && <span style={{ color: 'var(--text-secondary)' }}> ({actual.gap_pct > 0 ? '+' : ''}{actual.gap_pct.toFixed(2)}%)</span>}
        </div>
      )}
    </div>
  )
}

function RegimeSeverityBadge({ label }: { label: string }) {
  const l = label.toLowerCase()
  if (l.includes('extreme') || l.includes('war') || l.includes('blockade')) return <span className="badge text-orange-400 border-orange-900 bg-orange-950/30">EXTREME</span>
  if (l.includes('bull') || l.includes('deal') || l.includes('peace')) return <span className="badge text-emerald-400 border-emerald-900 bg-emerald-950/30">BULLISH</span>
  if (l.includes('bear') || l.includes('crisis')) return <span className="badge text-red-400 border-red-900 bg-red-950/30">BEARISH</span>
  if (l.includes('diplomatic') || l.includes('restart')) return <span className="badge text-blue-400 border-blue-900 bg-blue-950/30">DE-ESC</span>
  return <span className="badge text-yellow-400 border-yellow-900 bg-yellow-950/30">NEUTRAL</span>
}

function CustomDot({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="text-xs p-1.5 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
      <p className="text-white">{d?.date}</p>
      <p className={d?.correct === 1 ? 'text-emerald-400' : d?.correct === 0 ? 'text-red-400' : 'text-yellow-400'}>{d?.label}</p>
    </div>
  )
}
