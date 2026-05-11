// ─── Prediction ───────────────────────────────────────────────────────────────
export type PredictionStatus = 'OPEN' | 'RIGHT' | 'WRONG' | 'PARTIAL_CORRECT' | 'PARTIAL' | 'CORRECT' | 'ABOVE_RANGE'
export type PredictionHorizon = '5D' | '7D' | '9D' | '10D' | '12D' | '2W' | '3W' | '4W' | '2M'

export interface Prediction {
  pred_id: string
  horizon: PredictionHorizon
  date: string
  stock: string
  prediction: string
  entry_price: number | null
  target: string
  confidence: number  // 1-5
  category: string
  reasoning: string
  factors_checked: string[]
  factors_not_checked: string[]
  check_date: string
  outcome: PredictionStatus | null
  outcome_price: number | null
  outcome_evidence: string | null
  postmortem: string | null
  scored_on: string | null
}

// ─── Forecast Session ──────────────────────────────────────────────────────────
export type ForecastGrade = 'CORRECT' | 'PARTIAL_CORRECT' | 'WRONG' | 'PENDING' | 'N/A_HOLIDAY'

export interface OpeningBias {
  direction: 'GAP_UP_STRONG' | 'GAP_UP_MILD' | 'FLAT' | 'GAP_DOWN_MILD' | 'GAP_DOWN' | 'GAP_DOWN_STRONG' | 'FLAT_TO_SLIGHT_GAP_UP' | string
  gap_pct_estimate: number
  gift_nifty_estimate: number
  key_drivers: string[]
  confidence: number
  generated_at: string
  note?: string
}

export interface OpeningBiasActual {
  nifty_open: number
  gift_nifty_preopen: number
  gap_pct: number
  direction: string
  direction_correct: boolean
  grade: string
  scoring_note: string
  pre_estimated_by?: string
  validation_required?: boolean
}

export interface SessionDirection {
  direction: string
  change_pct_estimate: number
  range_low: number
  range_high: number
  key_assumption: string
  confidence: number
  generated_at: string
  regime: string
  brent_forecast?: string
  scenario_weighted?: Record<string, { probability: number; description: string; nifty_impact: string }>
}

export interface SessionDirectionAccuracy {
  direction_correct: boolean | null
  direction_note: string
  in_range: boolean | null
  range_note: string
  brent_correct: boolean | null
  grade: ForecastGrade
}

export interface ForecastSession {
  session_date: string
  forecast_generated_at: string
  forecast_regime: string
  nifty_prev_close: number
  opening_bias: OpeningBias | null
  opening_bias_actual: OpeningBiasActual | null
  session_direction: SessionDirection | null
  session_direction_accuracy: SessionDirectionAccuracy | null
  lessons: string[]
  actual?: {
    nifty_open: number | null
    nifty_close: number | null
    nifty_change_pct: number | null
    brent_close: number | null
    session_theme: string
  }
}

// ─── Action ───────────────────────────────────────────────────────────────────
export type ActionType = 'BUY' | 'SELL' | 'HOLD' | 'WATCH' | 'ADD' | 'TRIM' | 'EXIT'
export type ActionUrgency = 'IMMEDIATE' | 'THIS_WEEK' | 'MONITOR' | 'LOW'
export type ActionStatus = 'ACTIVE' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED'

export interface Action {
  action_id: string
  type: ActionType
  urgency: ActionUrgency
  stock: string
  broker: string
  instruction: string
  rationale_short: string
  confidence: number
  confidence_basis: string
  signals_triggered: string[]
  prediction_support: string[]
  pnl_impact_if_right: string
  pnl_impact_if_wrong: string
  risk: string
  valid_until: string
  status: ActionStatus
  created_at: string
  updated_at: string
}

// ─── Holdings ─────────────────────────────────────────────────────────────────
export interface Holding {
  symbol: string
  yahoo: string
  qty: number
  avg: number
  source: string
  current_price?: number
  change_pct?: number
  pnl?: number
  pnl_pct?: number
}

// ─── Market Prices ─────────────────────────────────────────────────────────────
export interface IndexPrice {
  price: number
  prev_close: number
  change: number
  change_pct: number
  ticker: string
}

export interface MarketPrices {
  fetched_at: string
  fetched_at_ist: string
  indices: {
    NIFTY_50?: IndexPrice
    SENSEX?: IndexPrice
    BANKNIFTY?: IndexPrice
  }
  commodities: Record<string, { price: number; change_pct: number; unit: string }>
  portfolio: Record<string, { price: number; prev_close: number; change: number; change_pct: number }>
}

// ─── Accuracy Meta ────────────────────────────────────────────────────────────
export interface L1Scorecard {
  all_time: { total: number; open: number; scored: number; right: number; wrong: number; partial: number; accuracy_pct: number }
  by_horizon?: Record<string, { total: number; right: number; wrong: number; partial: number; accuracy_pct: number }>
  by_confidence?: Record<string, { total: number; right: number; accuracy_pct: number }>
  by_regime?: Record<string, { total: number; right: number; accuracy_pct: number }>
}

export interface AccuracyMeta {
  L1_scorecard: L1Scorecard
  L2_rca_log?: any[]
  L3_trend?: any
  framework_evolution_log?: any[]
}

// ─── Next Run Context ─────────────────────────────────────────────────────────
export interface MarketRegime {
  label: string
  key_risk: string
  dominant_risk: string
  crude_last: number
  crude_pct_change_today?: number
  nifty_last: number
  nifty_key_support: number
  nifty_key_resistance: number
  regime_since?: string
  regime_note?: string
}

export interface NextRunContext {
  last_updated_by: string
  last_updated_at: string
  market_regime: MarketRegime
  opening_bias?: OpeningBias
  opening_bias_actual?: OpeningBiasActual
  session_direction?: SessionDirection
  tomorrow_forecast?: {
    date: string
    opening_bias?: OpeningBias
    session_direction?: SessionDirection
  }
  open_predictions?: Array<{ id: string; stock: string; thesis: string; last_price: number; check_date: string; confidence_current: number }>
  prompt_for_morning_brief?: string
  stocks_to_watch?: string[]
}

// ─── Consolidated Dashboard Data ──────────────────────────────────────────────
export interface DashboardData {
  predictions: Prediction[]
  sessions: ForecastSession[]
  actions: Action[]
  holdings: Holding[]
  prices: MarketPrices
  accuracyMeta: AccuracyMeta
  context: NextRunContext
  briefingDates: { date: string; type: 'morning' | 'eod'; filename: string }[]
  lastUpdated: string
}

// ─── Changelog ────────────────────────────────────────────────────────────────
export type ChangelogCategory = 'TRADE' | 'FORECAST' | 'SYSTEM' | 'LESSON' | 'RISK'
export type ChangelogImpact = 'HIGH' | 'MEDIUM' | 'LOW'

export interface ChangelogEntry {
  id?: string
  date: string
  category: ChangelogCategory
  title: string
  what_happened?: string
  impact?: string
  what_to_do?: string[]      // array of action items
  what_not_to_do?: string[]  // array of things to avoid
  pnl_impact?: number        // signed INR value
  tags?: string[]
  source: 'auto' | 'manual'
  created_at?: string
  // legacy / auto-generated fields
  related_predictions?: string[]
  regime_at_time?: string
}
