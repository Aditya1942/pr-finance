import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    TrendingUp, TrendingDown, Wallet, PiggyBank,
    ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import AnimatedCounter from '../components/charts/AnimatedCounter'
import BarChart from '../components/charts/BarChart'
import DonutChart from '../components/charts/DonutChart'
import SparkLine from '../components/charts/SparkLine'
import type { DashboardSummary, AccountBalance, BalanceSheetData } from '../types'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(d: string): string {
    const date = new Date(d)
    return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`
}

function Dashboard() {
    const [data, setData] = useState<DashboardSummary | null>(null)
    const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([])
    const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            const [summary, balances, sheet] = await Promise.all([
                window.api.getDashboardSummary(),
                window.api.getAccountBalances().catch(() => []),
                window.api.getBalanceSheet().catch(() => null)
            ])
            setData(summary)
            setAccountBalances(balances)
            setBalanceSheet(sheet)
        } catch (err) {
            console.error('Failed to load dashboard:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="page">
                <div className="page__grid">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="summary-card" style={{ minHeight: 140 }} />
                    ))}
                </div>
            </div>
        )
    }

    if (!data) return null

    const barData = (data.monthlyTrends || []).map(t => ({
        label: MONTH_NAMES[parseInt(t.month.split('-')[1]) - 1] || t.month,
        income: t.income,
        expense: t.expense,
    }))

    const donutData = (data.categoryBreakdown || []).map(c => ({
        name: c.name,
        value: c.total,
        color: c.color,
    }))

    const sparkData = (data.dailyCashFlow || []).map(d => ({
        label: d.date,
        value: d.net,
    }))

    const totalExpForLeaderboard = data.topCategories?.reduce((s, c) => s + c.total, 0) || 1

    return (
        <div className="page">
            {/* ── Summary Cards ── */}
            <div className="page__grid">
                <div className="summary-card summary-card--income">
                    <div className="summary-card__icon">
                        <TrendingUp size={22} />
                    </div>
                    <div className="summary-card__label">Total Income</div>
                    <div className="summary-card__value">
                        <AnimatedCounter value={data.totalIncome} prefix="₹" decimals={0} />
                    </div>
                </div>

                <div className="summary-card summary-card--expense">
                    <div className="summary-card__icon">
                        <TrendingDown size={22} />
                    </div>
                    <div className="summary-card__label">Total Expenses</div>
                    <div className="summary-card__value">
                        <AnimatedCounter value={data.totalExpense} prefix="₹" decimals={0} />
                    </div>
                </div>

                <div className="summary-card summary-card--balance">
                    <div className="summary-card__icon">
                        <Wallet size={22} />
                    </div>
                    <div className="summary-card__label">Net Balance</div>
                    <div className="summary-card__value">
                        <AnimatedCounter value={data.netBalance} prefix="₹" decimals={0} />
                    </div>
                </div>

                <div className="summary-card summary-card--savings">
                    <div className="summary-card__icon">
                        <PiggyBank size={22} />
                    </div>
                    <div className="summary-card__label">Savings Rate</div>
                    <div className="summary-card__value">
                        <AnimatedCounter value={data.savingsRate} suffix="%" decimals={1} />
                    </div>
                </div>
            </div>

            {/* ── Charts Row ── */}
            <div className="page__grid--2">
                {/* Monthly Trend Bar Chart */}
                <div className="chart-card" style={{ animationDelay: '0.2s' }}>
                    <div className="chart-card__header">
                        <div>
                            <h3 className="chart-card__title">Monthly Trend</h3>
                            <p className="chart-card__subtitle">Income vs Expenses — Last 6 months</p>
                        </div>
                    </div>
                    {barData.length > 0 ? (
                        <BarChart data={barData} height={260} />
                    ) : (
                        <div className="card__empty">Add transactions to see trends</div>
                    )}
                </div>

                {/* Category Breakdown Donut */}
                <div className="chart-card" style={{ animationDelay: '0.3s' }}>
                    <div className="chart-card__header">
                        <div>
                            <h3 className="chart-card__title">Expense Breakdown</h3>
                            <p className="chart-card__subtitle">By category</p>
                        </div>
                    </div>
                    {donutData.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                            <DonutChart data={donutData} size={190} />
                            <div className="donut-legend">
                                {donutData.slice(0, 6).map(d => {
                                    const total = donutData.reduce((s, i) => s + i.value, 0)
                                    const pct = total > 0 ? (d.value / total * 100).toFixed(1) : '0'
                                    return (
                                        <div key={d.name} className="donut-legend__item">
                                            <span className="donut-legend__color" style={{ background: d.color }} />
                                            <span className="donut-legend__name">{d.name}</span>
                                            <span className="donut-legend__pct">{pct}%</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="card__empty">Add expense transactions to see breakdown</div>
                    )}
                </div>
            </div>

            {/* ── Cash Flow Sparkline ── */}
            {sparkData.length > 1 && (
                <div className="chart-card" style={{ animationDelay: '0.35s' }}>
                    <div className="chart-card__header">
                        <div>
                            <h3 className="chart-card__title">Cash Flow</h3>
                            <p className="chart-card__subtitle">Daily net flow — Last 30 days</p>
                        </div>
                    </div>
                    <SparkLine
                        data={sparkData}
                        height={100}
                        color="#6366f1"
                        fillColor="rgba(99, 102, 241, 0.1)"
                    />
                </div>
            )}

            {/* ── Bottom Row: Recent + Leaderboard + Balance Sheet ── */}
            <div className="page__grid--2">
                {/* Recent Transactions */}
                <div className="chart-card" style={{ animationDelay: '0.4s' }}>
                    <div className="chart-card__header">
                        <h3 className="chart-card__title">Recent Transactions</h3>
                    </div>
                    {data.recentTransactions.length > 0 ? (
                        <div className="tx-list">
                            {data.recentTransactions.map(tx => (
                                <div key={tx.id} className="tx-list__item">
                                    <div
                                        className="tx-list__icon"
                                        style={{
                                            background: tx.category_color + '18',
                                            color: tx.category_color
                                        }}
                                    >
                                        {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                    </div>
                                    <div className="tx-list__info">
                                        <div className="tx-list__desc">{tx.description || tx.category_name}</div>
                                        <div className="tx-list__meta">
                                            <span className="tx-list__category">{tx.category_name}</span>
                                            <span className="tx-list__date">• {formatDate(tx.date)}</span>
                                        </div>
                                    </div>
                                    <div className={`tx-list__amount tx-list__amount--${tx.type}`}>
                                        {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card__empty">No transactions yet. Add your first transaction!</div>
                    )}
                </div>

                {/* Top Spending Categories Leaderboard */}
                <div className="chart-card" style={{ animationDelay: '0.45s' }}>
                    <div className="chart-card__header">
                        <h3 className="chart-card__title">Top Spending</h3>
                    </div>
                    {data.topCategories && data.topCategories.length > 0 ? (
                        <div className="leaderboard">
                            {data.topCategories.map((cat, idx) => (
                                <div key={cat.name} className="leaderboard__item">
                                    <span className="leaderboard__rank">{idx + 1}</span>
                                    <div className="leaderboard__bar-wrap">
                                        <div className="leaderboard__label-row">
                                            <span className="leaderboard__name">{cat.name}</span>
                                            <span className="leaderboard__amount">₹{Number(cat.total).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="leaderboard__bar">
                                            <div
                                                className="leaderboard__bar-fill"
                                                style={{
                                                    width: `${(cat.total / totalExpForLeaderboard) * 100}%`,
                                                    background: cat.color,
                                                    animationDelay: `${idx * 100}ms`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card__empty">Add expenses to see top categories</div>
                    )}
                </div>
            </div>

            {/* Bank & cash snapshot (when accounts exist) */}
            {accountBalances.filter(a => ['cash', 'bank', 'saving'].includes(a.type)).length > 0 && (
                <div className="chart-card" style={{ animationDelay: '0.48s' }}>
                    <div className="chart-card__header">
                        <h3 className="chart-card__title">Bank & Cash</h3>
                        <Link to="/accounts" style={{ fontSize: 13, color: 'var(--color-accent-indigo)' }}>View all</Link>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {accountBalances.filter(a => ['cash', 'bank', 'saving'].includes(a.type)).map(a => (
                            <div key={a.id} style={{ padding: '12px 16px', background: 'var(--color-surface-elevated)', borderRadius: 10, minWidth: 140 }}>
                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>{a.name}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16 }}>₹{Number(a.balance).toLocaleString('en-IN')}</div>
                            </div>
                        ))}
                        <div style={{ padding: '12px 16px', background: 'var(--color-bg-tertiary)', borderRadius: 10, minWidth: 140, border: '1px dashed var(--color-border)' }}>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Total</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16 }}>
                                ₹{Number(accountBalances.filter(a => ['cash', 'bank', 'saving'].includes(a.type)).reduce((s, a) => s + a.balance, 0)).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Balance Sheet (Legacy parity: Assets = Liabilities when accounts exist) ── */}
            <div className="balance-sheet" style={{ animationDelay: '0.5s' }}>
                <div className="balance-sheet__header">
                    <h3 className="balance-sheet__title">Balance Sheet</h3>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>All time</span>
                </div>
                <div className="balance-sheet__body">
                    {balanceSheet && (balanceSheet.assets.length > 0 || balanceSheet.liabilities.length > 0) ? (
                        <>
                            <div className="balance-sheet__column balance-sheet__column--income">
                                <h4 className="balance-sheet__column-title">Assets</h4>
                                {balanceSheet.assets.map(a => (
                                    <div key={a.id} className="balance-sheet__row">
                                        <span className="balance-sheet__row-label">{a.name}</span>
                                        <span className="balance-sheet__row-value text-income">₹{Number(a.balance).toLocaleString('en-IN')}</span>
                                    </div>
                                ))}
                                <div className="balance-sheet__row" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 4, fontWeight: 700 }}>
                                    <span>Total Assets</span>
                                    <span className="balance-sheet__row-value text-income" style={{ fontSize: 15 }}>₹{Number(balanceSheet.totalAssets).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            <div className="balance-sheet__column balance-sheet__column--expense">
                                <h4 className="balance-sheet__column-title">Liabilities & Equity</h4>
                                {balanceSheet.liabilities.map(a => (
                                    <div key={a.id} className="balance-sheet__row">
                                        <span className="balance-sheet__row-label">{a.name}</span>
                                        <span className="balance-sheet__row-value text-expense">₹{Number(a.balance).toLocaleString('en-IN')}</span>
                                    </div>
                                ))}
                                <div className="balance-sheet__row" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 4, fontWeight: 700 }}>
                                    <span>Total Liabilities</span>
                                    <span className="balance-sheet__row-value text-expense" style={{ fontSize: 15 }}>₹{Number(balanceSheet.totalLiabilities).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="balance-sheet__column balance-sheet__column--income">
                                <h4 className="balance-sheet__column-title">Assets (Income)</h4>
                                {data.categoryBreakdown && data.monthlyTrends ? (
                                    <>
                                        {getIncomeBreakdown(data).map(item => (
                                            <div key={item.name} className="balance-sheet__row">
                                                <span className="balance-sheet__row-label">
                                                    <span className="balance-sheet__row-dot" style={{ background: item.color }} />
                                                    {item.name}
                                                </span>
                                                <span className="balance-sheet__row-value text-income">₹{Number(item.total).toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                        <div className="balance-sheet__row" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 4, fontWeight: 700 }}>
                                            <span>Total Assets</span>
                                            <span className="balance-sheet__row-value text-income" style={{ fontSize: 15 }}>₹{Number(data.totalIncome).toLocaleString('en-IN')}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="card__empty">No income data</div>
                                )}
                            </div>
                            <div className="balance-sheet__column balance-sheet__column--expense">
                                <h4 className="balance-sheet__column-title">Liabilities (Expenses)</h4>
                                {data.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                                    <>
                                        {data.categoryBreakdown.map(item => (
                                            <div key={item.name} className="balance-sheet__row">
                                                <span className="balance-sheet__row-label">
                                                    <span className="balance-sheet__row-dot" style={{ background: item.color }} />
                                                    {item.name}
                                                </span>
                                                <span className="balance-sheet__row-value text-expense">₹{Number(item.total).toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                        <div className="balance-sheet__row" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 4, fontWeight: 700 }}>
                                            <span>Total Liabilities</span>
                                            <span className="balance-sheet__row-value text-expense" style={{ fontSize: 15 }}>₹{Number(data.totalExpense).toLocaleString('en-IN')}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="card__empty">No expense data</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
                <div className="balance-sheet__footer">
                    <span className="balance-sheet__footer-label">Net Worth</span>
                    <span className={`balance-sheet__footer-value ${data.netBalance >= 0 ? 'balance-sheet__footer-value--positive' : 'balance-sheet__footer-value--negative'}`}>
                        ₹{Number(data.netBalance).toLocaleString('en-IN')}
                    </span>
                </div>
            </div>
        </div>
    )
}

// Helper: get income category breakdown by querying recent transactions
function getIncomeBreakdown(data: DashboardSummary) {
    // We use recentTransactions to estimate income categories since
    // categoryBreakdown only contains expense categories
    const incomeMap = new Map<string, { name: string; color: string; total: number }>()
    for (const tx of data.recentTransactions) {
        if (tx.type === 'income') {
            const existing = incomeMap.get(tx.category_name) || { name: tx.category_name, color: tx.category_color, total: 0 }
            existing.total += tx.amount
            incomeMap.set(tx.category_name, existing)
        }
    }

    if (incomeMap.size === 0) {
        // Fallback: show total income as single entry
        return [{ name: 'Total Income', color: '#22c55e', total: data.totalIncome }]
    }

    return Array.from(incomeMap.values())
}

export default Dashboard
