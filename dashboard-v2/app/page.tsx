'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DashboardData, ChangelogEntry } from '@/lib/types'
import CommandCenter from '@/components/CommandCenter'
import IntelligenceTab from '@/components/IntelligenceTab'
import PredictionsTab from '@/components/PredictionsTab'
import PortfolioTab from '@/components/PortfolioTab'
import ChangelogTab from '@/components/ChangelogTab'
import PlaybookTab from '@/components/PlaybookTab'

const TABS = [
  { id: 'command', label: '🎯 Command', shortLabel: 'CMD' },
  { id: 'intelligence', label: '🧠 Intelligence', shortLabel: 'INTEL' },
  { id: 'predictions', label: '🔬 Predictions', shortLabel: 'PRED' },
  { id: 'portfolio', label: '💼 Portfolio', shortLabel: 'PF' },
  { id: 'changelog', label: '📓 War Room', shortLabel: 'LOG' },
  { id: 'playbook', label: '📖 Playbook', shortLabel: 'PLAY' },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState('command')
  const [data, setData] = useState<DashboardData | null>(null)
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    try {
      const [dataRes, changelogRes] = await Promise.all([
        fetch('/api/data', { cache: 'no-store' }),
        fetch('/api/changelog', { cache: 'no-store' }),
      ])
      if (!dataRes.ok) throw new Error(`Data fetch failed: ${dataRes.status}`)
      const d = await dataRes.json()
      const cl = changelogRes.ok ? await changelogRes.json() : []
      setData(d)
      setChangelog(cl)
      setLastRefresh(new Date())
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Auto-refresh every 5 minutes (matching sync.sh cadence)
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  const regime = data?.context?.market_regime
  const regimeColor = getRegimeColor(regime?.label || '')
  const nifty = data?.prices?.indices?.NIFTY_50
  const niftyUp = (nifty?.change_pct || 0) >= 0

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* ── TOP HEADER ── */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'rgba(7,12,26,0.97)', borderColor: 'var(--bg-border)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center justify-between gap-4">

          {/* Logo + regime */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-bold text-sm text-white whitespace-nowrap">PI</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold tracking-wide truncate max-w-48"
              style={{ background: `${regimeColor}22`, color: regimeColor, border: `1px solid ${regimeColor}44` }}>
              {regime?.label?.replace(/_/g, ' ') || 'LOADING'}
            </span>
          </div>

          {/* Live prices */}
          {nifty && (
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <LivePrice label="NIFTY" price={nifty.price} changePct={nifty.change_pct} />
              {data?.prices?.indices?.BANKNIFTY && (
                <LivePrice label="BANK" price={data.prices.indices.BANKNIFTY.price} changePct={data.prices.indices.BANKNIFTY.change_pct} />
              )}
              {data?.prices?.commodities?.BRENT && (
                <LivePrice label="BRENT" price={data.prices.commodities.BRENT.price} changePct={data.prices.commodities.BRENT.change_pct} unit="$" />
              )}
            </div>
          )}

          {/* Right: refresh + time */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="hidden md:block">{data?.lastUpdated || '—'}</span>
            <button onClick={fetchData}
              className="px-2 py-1 rounded text-xs font-medium transition-all hover:text-white"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              ↻ Sync
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-screen-2xl mx-auto px-4 flex gap-0.5 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'text-white border-blue-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-3 py-4 sm:px-4">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading intelligence…</span>
            </div>
          </div>
        )}

        {error && !data && (
          <div className="p-4 rounded-lg border border-red-900 bg-red-950/20 text-red-400 text-sm">
            <strong>Error loading data:</strong> {error}
            <br /><span className="text-xs opacity-60">Ensure you're running from the dashboard-v2/ folder and JSON data files exist in ../data/</span>
          </div>
        )}

        {data && (
          <div className="animate-fade-in">
            {activeTab === 'command' && <CommandCenter data={data} onTabChange={setActiveTab} />}
            {activeTab === 'intelligence' && <IntelligenceTab data={data} />}
            {activeTab === 'predictions' && <PredictionsTab data={data} />}
            {activeTab === 'portfolio' && <PortfolioTab data={data} />}
            {activeTab === 'changelog' && <ChangelogTab data={data} changelog={changelog} onRefresh={fetchData} />}
            {activeTab === 'playbook' && <PlaybookTab data={data} />}
          </div>
        )}
      </main>
    </div>
  )
}

function LivePrice({ label, price, changePct, unit = '₹' }: { label: string; price: number; changePct: number; unit?: string }) {
  const up = changePct >= 0
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color: 'var(--text-muted)' }} className="font-mono text-xs">{label}</span>
      <span className="font-mono font-medium text-xs text-white">{unit}{price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
      <span className={`font-mono text-xs font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
        {up ? '▲' : '▼'}{Math.abs(changePct).toFixed(2)}%
      </span>
    </div>
  )
}

function getRegimeColor(label: string): string {
  const l = label.toLowerCase()
  if (l.includes('extreme') || l.includes('war') || l.includes('blockade')) return '#f97316'
  if (l.includes('bull') || l.includes('relief') || l.includes('deal') || l.includes('peace')) return '#10b981'
  if (l.includes('bear') || l.includes('crash') || l.includes('crisis')) return '#ef4444'
  if (l.includes('diplomatic') || l.includes('restart')) return '#3b82f6'
  return '#f59e0b'
}
