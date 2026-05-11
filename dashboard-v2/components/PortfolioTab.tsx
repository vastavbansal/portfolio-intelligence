'use client'

import { useState } from 'react'
import { DashboardData } from '@/lib/types'

interface Props { data: DashboardData }

export default function PortfolioTab({ data }: Props) {
  const { holdings, actions, prices } = data
  const [view, setView] = useState<'holdings' | 'actions'>('holdings')

  const enriched = holdings.map(h => ({
    ...h,
    value: h.current_price ? h.current_price * h.qty : h.avg * h.qty,
    pnl: h.pnl || 0,
    pnl_pct: h.pnl_pct || 0,
  }))

  const totalValue = enriched.reduce((s, h) => s + h.value, 0)
  const totalPnl = enriched.reduce((s, h) => s + h.pnl, 0)
  const winners = enriched.filter(h => h.pnl > 0).length
  const losers = enriched.filter(h => h.pnl < 0).length

  const activeActions = actions.filter(a => a.status === 'ACTIVE')
  const urgentCount = activeActions.filter(a => a.urgency === 'IMMEDIATE').length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>PORTFOLIO VALUE</p>
          <p className="text-xl font-bold text-white">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>UNREALIZED P&L</p>
          <p className={`text-xl font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>HOLDINGS</p>
          <p className="text-xl font-bold text-white">{holdings.length}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{winners} ▲ · {losers} ▼</p>
        </div>
        <div className="rounded-xl border p-4 cursor-pointer card-hover" onClick={() => setView('actions')}
          style={{ background: 'var(--bg-card)', borderColor: urgentCount > 0 ? '#f97316' : 'var(--bg-border)' }}>
          <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>ACTIVE ACTIONS</p>
          <p className="text-xl font-bold" style={{ color: urgentCount > 0 ? '#f97316' : 'white' }}>{activeActions.length}</p>
          <p className="text-xs mt-0.5 text-orange-400">{urgentCount > 0 ? `${urgentCount} URGENT` : 'All clear'}</p>
        </div>
      </div>

      {/* Sub-view toggle */}
      <div className="flex gap-1 w-fit p-1 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
        {(['holdings', 'actions'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === v ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            style={view === v ? { background: 'var(--bg-elevated)' } : {}}>
            {v === 'holdings' ? `💼 Holdings (${holdings.length})` : `⚡ Actions (${activeActions.length})`}
          </button>
        ))}
      </div>

      {/* Holdings Table */}
      {view === 'holdings' && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  <th className="text-left py-2.5 px-3 font-medium">SYMBOL</th>
                  <th className="text-right py-2.5 px-3 font-medium">QTY</th>
                  <th className="text-right py-2.5 px-3 font-medium">AVG</th>
                  <th className="text-right py-2.5 px-3 font-medium">LTP</th>
                  <th className="text-right py-2.5 px-3 font-medium">TODAY</th>
                  <th className="text-right py-2.5 px-3 font-medium">P&L</th>
                  <th className="text-right py-2.5 px-3 font-medium">P&L%</th>
                  <th className="text-right py-2.5 px-3 font-medium">VALUE</th>
                  <th className="text-center py-2.5 px-3 font-medium">BROKER</th>
                </tr>
              </thead>
              <tbody>
                {enriched.sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl)).map(h => (
                  <tr key={`${h.symbol}-${h.source}`} className="border-t card-hover" style={{ borderColor: 'var(--bg-border)' }}>
                    <td className="py-2 px-3 font-semibold text-white">{h.symbol}</td>
                    <td className="py-2 px-3 text-right" style={{ color: 'var(--text-secondary)' }}>{h.qty}</td>
                    <td className="py-2 px-3 text-right" style={{ color: 'var(--text-secondary)' }}>₹{h.avg.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</td>
                    <td className="py-2 px-3 text-right font-medium text-white">
                      {h.current_price ? `₹${h.current_price.toLocaleString('en-IN', { maximumFractionDigits: 1 })}` : '—'}
                    </td>
                    <td className={`py-2 px-3 text-right font-medium ${(h.change_pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {h.change_pct !== undefined ? `${h.change_pct >= 0 ? '+' : ''}${h.change_pct.toFixed(2)}%` : '—'}
                    </td>
                    <td className={`py-2 px-3 text-right font-semibold ${h.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {h.pnl >= 0 ? '+' : ''}₹{Math.abs(h.pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className={`py-2 px-3 text-right font-medium ${h.pnl_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {h.pnl_pct >= 0 ? '+' : ''}{h.pnl_pct.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right" style={{ color: 'var(--text-secondary)' }}>
                      ₹{h.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{h.source}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-elevated)', color: 'white' }}>
                  <td colSpan={5} className="py-2.5 px-3 font-semibold">TOTAL</td>
                  <td className={`py-2.5 px-3 text-right font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-2.5 px-3" />
                  <td className="py-2.5 px-3 text-right font-bold">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  <td className="py-2.5 px-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      {view === 'actions' && (
        <div className="space-y-3">
          {activeActions.length === 0 && (
            <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No active actions</p>
            </div>
          )}
          {activeActions.map(a => {
            const urgencyColor = a.urgency === 'IMMEDIATE' ? '#ef4444' : a.urgency === 'THIS_WEEK' ? '#f59e0b' : '#3b82f6'
            const typeColor = ['BUY', 'ADD'].includes(a.type) ? '#10b981' : ['SELL', 'EXIT', 'TRIM'].includes(a.type) ? '#ef4444' : '#3b82f6'
            return (
              <div key={a.action_id} className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: urgencyColor + '44' }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold px-2 py-0.5 rounded" style={{ background: typeColor + '22', color: typeColor, border: `1px solid ${typeColor}44` }}>{a.type}</span>
                    <h3 className="font-bold text-white">{a.stock}</h3>
                    <span className="badge" style={{ background: urgencyColor + '22', color: urgencyColor, border: `1px solid ${urgencyColor}44` }}>{a.urgency}</span>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {[1,2,3,4,5].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= a.confidence ? 'bg-blue-400' : 'bg-slate-700'}`} />)}
                  </div>
                </div>
                <p className="text-sm font-medium text-white mb-1">{a.instruction}</p>
                <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{a.rationale_short}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg p-2" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="font-semibold text-emerald-400 mb-0.5">If RIGHT</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{a.pnl_impact_if_right}</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="font-semibold text-red-400 mb-0.5">If WRONG</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{a.pnl_impact_if_wrong}</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="font-semibold text-yellow-400 mb-0.5">Risk</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{a.risk}</p>
                  </div>
                </div>
                {a.signals_triggered?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {a.signals_triggered.map((s, i) => (
                      <span key={i} className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>⚡ {s}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Valid until: {a.valid_until}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
