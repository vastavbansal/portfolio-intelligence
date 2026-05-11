'use client'

import { useState } from 'react'
import { DashboardData } from '@/lib/types'

interface Props { data: DashboardData }

// ── Static playbook content ───────────────────────────────────────────────────
// Each regime has strategies, rules, and pattern cards.
// This is populated from the user's system knowledge (L2/L3 RCA learnings).

const REGIMES = [
  'BULL_TREND',
  'BEAR_TREND',
  'SIDEWAYS_CHOPPY',
  'RELIEF_RALLY',
  'EXTREME_FEAR',
  'GEOPOLITICAL_STRESS',
  'POST_CRISIS_RESTART',
] as const

type RegimeKey = typeof REGIMES[number]

interface RegimePlaybook {
  label: string
  emoji: string
  color: string
  description: string
  bias: string
  do: string[]
  dont: string[]
  watch: string[]
  sizing: string
  edge_patterns: { name: string; setup: string; outcome: string }[]
}

const PLAYBOOKS: Record<RegimeKey, RegimePlaybook> = {
  BULL_TREND: {
    label: 'Bull Trend',
    emoji: '🐂',
    color: '#10b981',
    description: 'Sustained uptrend with broad participation. Dips are bought, breakouts follow through.',
    bias: 'LONG',
    do: [
      'Buy breakouts from consolidation with volume confirmation',
      'Add to winners on pullbacks to 20 EMA',
      'Hold positions longer — let profits run',
      'Focus on sector leaders, not laggards',
      'Use dips as entry opportunities, not exit signals',
    ],
    dont: [
      'Short against the trend — costs money and time',
      'Over-trade during minor consolidations',
      'Exit too early on strong momentum stocks',
      'Chase stocks that have already broken out 15%+',
    ],
    watch: ['Breadth divergence — fewer stocks making new highs', 'Sector rotation weakening', 'VIX creeping up despite price highs'],
    sizing: 'Full sizing (100%). Can go up to 1.2x on highest-conviction setups.',
    edge_patterns: [
      { name: 'Pullback to Rising 20 EMA', setup: 'Stock in uptrend, pulls back to 20 EMA with low volume, bounces with high volume', outcome: 'Risk:reward 1:3+, ~65% hit rate' },
      { name: 'Sector Rotation Entry', setup: 'Laggard sector starts showing relative strength vs leader', outcome: 'Multi-week move possible, risk:reward 1:4' },
    ],
  },
  BEAR_TREND: {
    label: 'Bear Trend',
    emoji: '🐻',
    color: '#ef4444',
    description: 'Sustained downtrend. Rallies are sold, support levels break. Protect capital.',
    bias: 'FLAT / SHORT',
    do: [
      'Reduce position size aggressively — capital preservation first',
      'Raise cash on any meaningful bounce (3-5% rally)',
      'Trim weakest holdings first, keep strongest',
      'Tighten stop-losses across all positions',
      'Wait for evidence of regime change before buying',
    ],
    dont: [
      'Buy every dip — bear market rallies are vicious and short',
      'Average down in a bear market',
      'Hold on to losers hoping for recovery',
      'Use leverage in any direction during uncertainty',
    ],
    watch: ['Any close above 200 DMA on Nifty — potential regime change', 'FII flows turning positive', 'VIX compression below 15'],
    sizing: 'Reduced sizing (40-60%). Maximum capital preservation mode.',
    edge_patterns: [
      { name: 'Dead Cat Bounce Short', setup: '3-5% rally into resistance after breakdown, high volume reversal candle', outcome: 'High probability, risk:reward 1:2' },
      { name: 'Breakdown Retest', setup: 'Stock breaks key support, rallies back to test it from below, fails', outcome: 'Very reliable, risk:reward 1:2.5' },
    ],
  },
  SIDEWAYS_CHOPPY: {
    label: 'Sideways / Choppy',
    emoji: '↔️',
    color: '#f59e0b',
    description: 'No clear direction. Fakeouts frequent. Range-bound action. Time-consuming for trend traders.',
    bias: 'NEUTRAL',
    do: [
      'Trade range extremes — buy near support, sell near resistance',
      'Keep position sizes small — chop eats P&L',
      'Take profits faster than usual',
      'Let cash work — opportunity cost is low in choppy markets',
      'Focus on stock-specific catalysts (earnings, results)',
    ],
    dont: [
      'Breakout trade in a choppy market — too many fakeouts',
      'Carry large overnight positions',
      'Overthink or overanalyze — the market has no edge to give right now',
      'Force trades out of boredom',
    ],
    watch: ['Volatility compression (VIX falling in range) — coil before move', 'Nifty range boundaries (watch for decisive break)', 'Global triggers (US Fed, FII)'],
    sizing: 'Reduced sizing (50-70%). Preserve capital, trade smaller.',
    edge_patterns: [
      { name: 'Range Fade', setup: 'Price hits upper/lower range boundary with exhaustion candle', outcome: '55% hit rate, small reward, tight stop' },
      { name: 'Earnings Catalyst', setup: 'Strong results + stock near support in choppy market', outcome: 'Standalone move regardless of index, risk:reward 1:2' },
    ],
  },
  RELIEF_RALLY: {
    label: 'Relief Rally',
    emoji: '🟢',
    color: '#34d399',
    description: 'Bounce after oversold conditions. Sharp, fast moves. Can transition to new bull or fail.',
    bias: 'CAUTIOUSLY LONG',
    do: [
      'Participate but with tighter-than-normal stops',
      'Take profits at 50% and 61.8% Fibonacci retracements',
      'Prefer quality large-caps over beaten-down smallcaps',
      'Monitor for follow-through volume confirmation',
    ],
    dont: [
      'Go all-in assuming a new bull market has started',
      'Chase stocks up 20%+ from lows',
      'Ignore the macro context that caused the selloff',
    ],
    watch: ['Volume on the rally — anemic volume = likely to fail', 'FII flows', 'Whether Nifty can close above 200 DMA and hold'],
    sizing: 'Moderate (60-80%). It\'s a rally, not a confirmed new trend.',
    edge_patterns: [
      { name: 'V-Bottom Breakout', setup: 'Sharp reversal from extreme low, 3 days of accumulation, then breakout', outcome: 'Very high reward but confirmation required' },
    ],
  },
  EXTREME_FEAR: {
    label: 'Extreme Fear',
    emoji: '🔴',
    color: '#f97316',
    description: 'Panic selling, VIX elevated, indiscriminate selling. Historically a buying opportunity with patience.',
    bias: 'WAIT, THEN BUY',
    do: [
      'Go to maximum cash (80-100%) at first sign',
      'Make a watchlist of quality stocks you want to own',
      'Wait for 2-3 days of selling to stabilize before stepping in',
      'Buy in tranches — not all at once',
      'Focus only on Nifty 50 constituents for safety',
    ],
    dont: [
      'Catch falling knives — let the panic exhaust itself',
      'Check P&L every 30 minutes — it will cloud judgment',
      'Make emotional decisions based on news headlines',
      'Sell quality at panic lows',
    ],
    watch: ['VIX above 25 = extreme fear; above 30 = capitulation possible', 'India VIX compression after spike', 'Nifty closing above prior day high for 2 consecutive days'],
    sizing: 'Emergency mode: maximum cash. Re-enter slowly with 20% tranches.',
    edge_patterns: [
      { name: 'Capitulation Buy', setup: 'VIX spike to 25+, massive volume selloff day, then inside day or reversal candle', outcome: 'Multi-week rally, risk:reward 1:5+ if timed right' },
    ],
  },
  GEOPOLITICAL_STRESS: {
    label: 'Geopolitical Stress',
    emoji: '⚠️',
    color: '#f97316',
    description: 'Uncertainty from geopolitical events (war, sanctions, border tensions). Markets price in worst case, then recover.',
    bias: 'DEFENSIVE',
    do: [
      'Reduce exposure to sectors with direct geopolitical sensitivity (oil importers, defence manufacturers)',
      'Hold Nifty or defensive large-caps if staying invested',
      'Monitor oil prices closely — INR and markets are sensitive',
      'Keep cash for opportunity if/when resolution comes',
    ],
    dont: [
      'Panic sell quality at geopolitical lows — events usually resolve',
      'Trade on news headlines in real-time',
      'Ignore the macro context and trade as if nothing has changed',
    ],
    watch: ['Oil price trajectory (Brent above $90 = sustained headwind)', 'INR/USD rate', 'FII flows (selling = stay cautious)', 'Diplomatic signals'],
    sizing: 'Defensive (50-70%). Wait for clarity before full deployment.',
    edge_patterns: [
      { name: 'Geopolitical Resolution Surge', setup: 'Confirmed diplomatic progress/ceasefire, market gap-up, pullback to open', outcome: 'Buy the first pullback — can be multi-week move' },
    ],
  },
  POST_CRISIS_RESTART: {
    label: 'Post-Crisis Restart',
    emoji: '🚀',
    color: '#3b82f6',
    description: 'Markets recovering from a major event. Beaten-down sectors recover first. Quality leads.',
    bias: 'LONG — ACCUMULATE',
    do: [
      'Systematically add to quality positions that were sold in panic',
      'Focus on beaten-down sectors that have strong fundamentals',
      'Use SIP-style accumulation rather than lump-sum',
      'Document your thesis and check against data regularly',
    ],
    dont: [
      'Expect a straight-line recovery — there will be re-tests',
      'Buy the weakest stocks hoping for biggest bounce',
      'Exit too early if original thesis is intact',
    ],
    watch: ['Earnings season as confirmation of recovery', 'FII flows turning consistently positive', 'Credit spreads normalizing'],
    sizing: 'Build back toward full (70-100% over time with confirmation).',
    edge_patterns: [
      { name: 'Quality Accumulation Zone', setup: 'Stock with strong fundamentals 30%+ below all-time high, sector recovering', outcome: '12-18 month horizon, excellent risk:reward' },
    ],
  },
}

function RegimeCard({ rk, playbook, isActive }: { rk: RegimeKey; playbook: RegimePlaybook; isActive: boolean }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`rounded-xl border transition-all ${isActive ? 'ring-2' : ''}`}
      style={{
        background: 'var(--bg-card)',
        borderColor: isActive ? playbook.color : 'var(--bg-border)',
        ...(isActive ? { '--tw-ring-color': playbook.color } as any : {})
      }}>
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <span className="text-2xl">{playbook.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-sm">{playbook.label}</h3>
            {isActive && (
              <span className="badge font-semibold animate-pulse" style={{ background: `${playbook.color}22`, color: playbook.color, border: `1px solid ${playbook.color}44` }}>
                ● ACTIVE
              </span>
            )}
            <span className="badge text-xs font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              {playbook.bias}
            </span>
          </div>
          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{playbook.description}</p>
        </div>
        <span className="text-slate-500 text-xs">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: 'var(--bg-border)' }}>
          <p className="text-sm pt-3" style={{ color: 'var(--text-secondary)' }}>{playbook.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* DO */}
            <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid #10b98133' }}>
              <p className="text-xs font-semibold tracking-widest mb-2 text-emerald-400">✓ PLAYBOOK — DO</p>
              <ul className="space-y-1.5">
                {playbook.do.map((item, i) => (
                  <li key={i} className="text-xs flex gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <span className="text-emerald-500 flex-shrink-0 mt-0.5">›</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DON'T */}
            <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid #ef444433' }}>
              <p className="text-xs font-semibold tracking-widest mb-2 text-red-400">✗ PLAYBOOK — DON'T</p>
              <ul className="space-y-1.5">
                {playbook.dont.map((item, i) => (
                  <li key={i} className="text-xs flex gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <span className="text-red-500 flex-shrink-0 mt-0.5">›</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Watch list + Sizing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: '#f59e0b' }}>👁 WATCH FOR</p>
              <ul className="space-y-1">
                {playbook.watch.map((item, i) => (
                  <li key={i} className="text-xs flex gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: '#f59e0b' }} className="flex-shrink-0">›</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-xs font-semibold tracking-widest mb-2 text-blue-400">💰 POSITION SIZING</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{playbook.sizing}</p>
            </div>
          </div>

          {/* Edge patterns */}
          {playbook.edge_patterns.length > 0 && (
            <div>
              <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>⚡ EDGE PATTERNS</p>
              <div className="space-y-2">
                {playbook.edge_patterns.map((p, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)', border: `1px solid ${playbook.color}33` }}>
                    <p className="text-xs font-bold mb-1" style={{ color: playbook.color }}>{p.name}</p>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}><span className="font-semibold text-white">Setup:</span> {p.setup}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}><span className="font-semibold text-white">Outcome:</span> {p.outcome}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Core trading rules that apply always ──────────────────────────────────────
const GOLDEN_RULES = [
  { rule: 'Never average down in a loss', detail: 'If you are wrong, the market is telling you something. Exit and reassess.', severity: 'critical' },
  { rule: 'Trade what you see, not what you think', detail: 'Price action is the final arbiter. Thesis means nothing if price disagrees.', severity: 'critical' },
  { rule: 'Position size = risk, not conviction', detail: 'Never risk more than 2% of capital on a single trade regardless of confidence.', severity: 'critical' },
  { rule: 'Stop loss before entry', detail: 'Know where you are wrong before you enter. If you can\'t define it, don\'t trade.', severity: 'important' },
  { rule: 'Don\'t trade for excitement', detail: 'Boredom is not a reason to trade. The market has no obligation to give you action.', severity: 'important' },
  { rule: 'Let winners run, cut losers fast', detail: 'Asymmetric outcomes require asymmetric patience. Hold winners longer than feels comfortable.', severity: 'important' },
  { rule: 'News is noise, price is signal', detail: 'Wait for the market\'s reaction to news, not the news itself.', severity: 'important' },
  { rule: 'Cash is a position', detail: 'Doing nothing when there\'s no edge is the highest-conviction trade.', severity: 'note' },
]

export default function PlaybookTab({ data }: Props) {
  const [view, setView] = useState<'regimes' | 'rules'>('regimes')
  const currentRegime = data?.context?.market_regime?.label?.replace(/ /g, '_').toUpperCase() as RegimeKey | undefined

  // Match current regime to playbook key
  const activeKey = REGIMES.find(r =>
    currentRegime?.includes(r) || r.includes(currentRegime?.split('_')[0] || '')
  ) || undefined

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">📖 Playbook</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Regime-based strategy + inviolable trading rules
        </p>
      </div>

      {/* Current regime banner */}
      {activeKey && (
        <div className="rounded-xl border p-4" style={{
          background: `${PLAYBOOKS[activeKey].color}11`,
          borderColor: `${PLAYBOOKS[activeKey].color}44`
        }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{PLAYBOOKS[activeKey].emoji}</span>
            <span className="text-sm font-bold" style={{ color: PLAYBOOKS[activeKey].color }}>
              CURRENT REGIME: {PLAYBOOKS[activeKey].label.toUpperCase()}
            </span>
            <span className="badge animate-pulse" style={{ background: `${PLAYBOOKS[activeKey].color}22`, color: PLAYBOOKS[activeKey].color, border: `1px solid ${PLAYBOOKS[activeKey].color}44` }}>LIVE</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Bias: <span className="font-semibold text-white">{PLAYBOOKS[activeKey].bias}</span> · {PLAYBOOKS[activeKey].sizing}
          </p>
        </div>
      )}

      {/* Tab toggle */}
      <div className="flex gap-1 w-fit p-1 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
        {([['regimes', '📊 Regime Playbooks'], ['rules', '📜 Golden Rules']] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === v ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            style={view === v ? { background: 'var(--bg-elevated)' } : {}}>
            {label}
          </button>
        ))}
      </div>

      {/* Regime Playbooks */}
      {view === 'regimes' && (
        <div className="space-y-2">
          {/* Show active regime first */}
          {REGIMES.filter(rk => rk === activeKey).map(rk => (
            <RegimeCard key={rk} rk={rk} playbook={PLAYBOOKS[rk]} isActive={true} />
          ))}
          {/* Then the rest */}
          {REGIMES.filter(rk => rk !== activeKey).map(rk => (
            <RegimeCard key={rk} rk={rk} playbook={PLAYBOOKS[rk]} isActive={false} />
          ))}
        </div>
      )}

      {/* Golden Rules */}
      {view === 'rules' && (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            These rules apply regardless of regime. Violating them is costly. These were learned the hard way.
          </p>
          {GOLDEN_RULES.map((r, i) => {
            const colors = {
              critical: { bg: '#ef444411', color: '#ef4444', border: '#ef444433' },
              important: { bg: '#f59e0b11', color: '#f59e0b', border: '#f59e0b33' },
              note: { bg: '#3b82f611', color: '#3b82f6', border: '#3b82f633' },
            }
            const c = colors[r.severity as keyof typeof colors]
            return (
              <div key={i} className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: c.border }}>
                <div className="flex items-start gap-3">
                  <span className="text-lg font-bold font-mono" style={{ color: c.color }}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="font-bold text-sm text-white mb-1">{r.rule}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.detail}</p>
                  </div>
                  <span className="badge ml-auto flex-shrink-0 text-xs" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                    {r.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
