import fs from 'fs'
import path from 'path'
import type { DashboardData, Prediction, ForecastSession, Action, Holding, MarketPrices, AccuracyMeta, NextRunContext } from './types'

// Data lives one level up in ../data/ relative to this project
const DATA_DIR = path.join(process.cwd(), '..', 'data')
const BRIEFINGS_DIR = path.join(process.cwd(), '..', 'briefings')
const DAILY_BRIEFINGS_DIR = path.join(process.cwd(), '..', 'daily-briefings')

function readJSON<T>(filename: string, fallback: T): T {
  try {
    const filepath = path.join(DATA_DIR, filename)
    const raw = fs.readFileSync(filepath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function readBriefingFile(filepath: string): string {
  try {
    return fs.readFileSync(filepath, 'utf-8')
  } catch {
    return ''
  }
}

export function getPredictions(): Prediction[] {
  const raw = readJSON<any>('predictions-all.json', { predictions: [] })
  const preds = Array.isArray(raw) ? raw : (raw.predictions || [])
  return preds
}

export function getSessions(): ForecastSession[] {
  const raw = readJSON<any>('forecast-accuracy-log.json', { sessions: [] })
  return (raw.sessions || []).sort((a: any, b: any) => b.session_date.localeCompare(a.session_date))
}

export function getActions(): Action[] {
  const raw = readJSON<any>('actions.json', { actions: [] })
  return raw.actions || []
}

export function getHoldings(): Holding[] {
  const raw = readJSON<any>('holdings.json', { holdings: [] })
  return raw.holdings || []
}

export function getPrices(): MarketPrices {
  return readJSON<MarketPrices>('market-prices.json', {
    fetched_at: '',
    fetched_at_ist: '',
    indices: {},
    commodities: {},
    portfolio: {},
  })
}

export function getAccuracyMeta(): AccuracyMeta {
  return readJSON<AccuracyMeta>('accuracy-meta.json', {
    L1_scorecard: { all_time: { total: 0, open: 0, scored: 0, right: 0, wrong: 0, partial: 0, accuracy_pct: 0 } }
  })
}

export function getContext(): NextRunContext {
  return readJSON<NextRunContext>('next-run-context.json', {
    last_updated_by: '',
    last_updated_at: '',
    market_regime: { label: 'UNKNOWN', key_risk: '', dominant_risk: '', crude_last: 0, nifty_last: 0, nifty_key_support: 0, nifty_key_resistance: 0 }
  })
}

export function getBriefingDates() {
  const dates: { date: string; type: 'morning' | 'eod'; filename: string; dir: 'briefings' | 'daily-briefings' }[] = []

  // New briefings/ folder
  try {
    const files = fs.readdirSync(BRIEFINGS_DIR)
    for (const f of files) {
      const morningMatch = f.match(/^morning-(\d{4}-\d{2}-\d{2})\.md$/)
      const eodMatch = f.match(/^eod-(\d{4}-\d{2}-\d{2})\.md$/)
      if (morningMatch) dates.push({ date: morningMatch[1], type: 'morning', filename: f, dir: 'briefings' })
      if (eodMatch) dates.push({ date: eodMatch[1], type: 'eod', filename: f, dir: 'briefings' })
    }
  } catch {}

  // Legacy daily-briefings/ folder
  try {
    const files = fs.readdirSync(DAILY_BRIEFINGS_DIR)
    for (const f of files) {
      const legacyMatch = f.match(/^(\d{4}-\d{2}-\d{2})-(morning|eod|midday)\.md$/)
      if (legacyMatch) {
        const type = legacyMatch[2] === 'eod' ? 'eod' : 'morning'
        dates.push({ date: legacyMatch[1], type, filename: f, dir: 'daily-briefings' })
      }
    }
  } catch {}

  return dates.sort((a, b) => b.date.localeCompare(a.date))
}

export function getBriefingContent(filename: string, dir: 'briefings' | 'daily-briefings'): string {
  const base = dir === 'briefings' ? BRIEFINGS_DIR : DAILY_BRIEFINGS_DIR
  return readBriefingFile(path.join(base, filename))
}

export async function getDashboardData(): Promise<DashboardData> {
  const [predictions, sessions, actions, holdings, prices, accuracyMeta, context, briefingDates] = await Promise.all([
    getPredictions(),
    getSessions(),
    getActions(),
    getHoldings(),
    getPrices(),
    getAccuracyMeta(),
    getContext(),
    getBriefingDates(),
  ])

  // Enrich holdings with current prices
  const enrichedHoldings = holdings.map(h => {
    const priceData = prices.portfolio?.[h.yahoo] || prices.portfolio?.[h.symbol + '.NS']
    if (priceData) {
      const currentPrice = priceData.price
      const pnl = (currentPrice - h.avg) * h.qty
      const pnlPct = ((currentPrice - h.avg) / h.avg) * 100
      return { ...h, current_price: currentPrice, change_pct: priceData.change_pct, pnl, pnl_pct: pnlPct }
    }
    return h
  })

  return {
    predictions,
    sessions,
    actions,
    holdings: enrichedHoldings,
    prices,
    accuracyMeta,
    context,
    briefingDates: briefingDates.slice(0, 60), // last 60 briefings
    lastUpdated: prices.fetched_at_ist || new Date().toISOString(),
  }
}

// Build auto-changelog from existing data
export function buildAutoChangelog() {
  const predictions = getPredictions()
  const sessions = getSessions()
  const context = getContext()
  const entries: any[] = []

  // Prediction outcomes
  for (const p of predictions) {
    if (p.outcome && p.outcome !== null && p.scored_on) {
      const isRight = ['RIGHT', 'CORRECT'].includes(p.outcome)
      const isWrong = p.outcome === 'WRONG'
      entries.push({
        id: `pred-${p.pred_id}`,
        date: p.scored_on,
        category: 'FORECAST' as const,
        title: `${p.pred_id} ${p.stock}: ${p.outcome}`,
        what_happened: `${p.prediction}. ${p.outcome_evidence || ''}`,
        impact: isRight ? 'HIGH' : isWrong ? 'MEDIUM' : 'LOW',
        what_to_do: isRight ? ['Similar setups in same regime: high-confidence add'] : [],
        what_not_to_do: isWrong ? [p.postmortem || 'Avoid same setup without reassessment'] : [],
        related_predictions: [p.pred_id],
        regime_at_time: p.category || '',
        source: 'auto' as const,
        created_at: p.scored_on,
      })
    }
  }

  // Session lessons
  for (const s of sessions) {
    if (s.lessons && s.lessons.length > 0 && s.session_direction_accuracy?.grade && s.session_direction_accuracy.grade !== 'PENDING') {
      const grade = s.session_direction_accuracy.grade
      entries.push({
        id: `session-${s.session_date}`,
        date: s.session_date,
        category: 'LESSON' as const,
        title: `Session ${s.session_date}: Forecast ${grade}`,
        what_happened: s.session_direction_accuracy.direction_note || '',
        impact: grade === 'CORRECT' ? 'HIGH' : grade === 'WRONG' ? 'MEDIUM' : 'LOW',
        what_to_do: [] as string[],
        what_not_to_do: grade === 'WRONG' && s.lessons[0] ? [s.lessons[0]] : [],
        related_predictions: [],
        regime_at_time: s.forecast_regime || '',
        source: 'auto' as const,
        created_at: s.session_date,
      })
    }
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date))
}
