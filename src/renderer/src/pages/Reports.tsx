import { useState, useEffect } from 'react'
import { Download, Printer, TrendingUp, FileSpreadsheet } from 'lucide-react'
import BarChart from '../components/charts/BarChart'
import { getCurrencySymbol } from '../constants/currencies'
import type { ReportData, BalanceSheetData, PlReport } from '../types'

type Period = 'monthly' | 'quarterly' | 'yearly'
type ReportTab = 'income-expense' | 'balance-sheet'

function Reports() {
    const [defaultCurrency, setDefaultCurrency] = useState('USD')
    const [reportTab, setReportTab] = useState<ReportTab>('income-expense')
    const [period, setPeriod] = useState<Period>('monthly')
    const [dateFrom, setDateFrom] = useState<string>('')
    const [dateTo, setDateTo] = useState<string>('')
    const [data, setData] = useState<ReportData | null>(null)
    const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null)
    const [plReport, setPlReport] = useState<PlReport | null>(null)
    const [loading, setLoading] = useState(true)
    const [balanceSheetLoading, setBalanceSheetLoading] = useState(false)

    useEffect(() => {
        window.api.getDefaultCurrency().then(c => setDefaultCurrency(c || 'USD'))
    }, [])

    useEffect(() => {
        if (reportTab === 'income-expense') loadReport()
    }, [reportTab, period, dateFrom, dateTo])

    useEffect(() => {
        if (reportTab === 'balance-sheet') loadBalanceSheet()
    }, [reportTab])

    async function loadReport() {
        setLoading(true)
        try {
            const options =
                dateFrom || dateTo
                    ? { startDate: dateFrom || undefined, endDate: dateTo || undefined }
                    : undefined
            const report = await window.api.getReportData(period, options as any)
            setData(report)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function loadBalanceSheet() {
        setBalanceSheetLoading(true)
        try {
            const [sheet, pl] = await Promise.all([
                window.api.getBalanceSheet(),
                window.api.getPlReport(),
            ])
            setBalanceSheet(sheet)
            setPlReport(pl)
        } catch (err) {
            console.error(err)
        } finally {
            setBalanceSheetLoading(false)
        }
    }

    // Build chart data from summary
    const chartData = (data?.summary || []).slice(0, 12).reverse().map(s => ({
        label: formatPeriodLabel(s.period, period),
        income: s.income,
        expense: s.expense,
    }))

    // Group category-wise data by period
    const categoryByPeriod = new Map<string, Map<string, { color: string; total: number }>>()
    for (const row of data?.categoryWise || []) {
        if (!categoryByPeriod.has(row.period)) {
            categoryByPeriod.set(row.period, new Map())
        }
        categoryByPeriod.get(row.period)!.set(row.category, { color: row.color, total: row.total })
    }

    // Get all unique categories
    const allCategories = [...new Set((data?.categoryWise || []).map(r => r.category))]
    const categoryColors = new Map<string, string>()
    for (const row of data?.categoryWise || []) {
        categoryColors.set(row.category, row.color)
    }

    // Income by source pivot (by period)
    const incomeByPeriod = new Map<string, Map<string, { color: string; total: number }>>()
    for (const row of data?.incomeBySource || []) {
        if (!incomeByPeriod.has(row.period)) incomeByPeriod.set(row.period, new Map())
        incomeByPeriod.get(row.period)!.set(row.source, { color: row.color, total: row.total })
    }
    const allSources = [...new Set((data?.incomeBySource || []).map(r => r.source))]

    return (
        <div className="page">
            {/* Tabs + Period Selector + Export */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
                        Financial Reports
                    </h2>
                    <div className="period-selector" style={{ margin: 0 }}>
                        <button
                            className={`period-selector__btn ${reportTab === 'income-expense' ? 'period-selector__btn--active' : ''}`}
                            onClick={() => setReportTab('income-expense')}
                        >
                            <TrendingUp size={14} style={{ marginRight: 4 }} />
                            Income / Expense
                        </button>
                        <button
                            className={`period-selector__btn ${reportTab === 'balance-sheet' ? 'period-selector__btn--active' : ''}`}
                            onClick={() => setReportTab('balance-sheet')}
                        >
                            <FileSpreadsheet size={14} style={{ marginRight: 4 }} />
                            Balance Sheet
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                        className="btn btn--ghost"
                        onClick={async () => {
                            const csv = await window.api.exportTransactionsToCsv()
                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
                            a.click()
                            URL.revokeObjectURL(url)
                        }}
                    >
                        <Download size={14} />
                        Export CSV
                    </button>
                    <button className="btn btn--ghost" onClick={() => window.print()}>
                        <Printer size={14} />
                        Print
                    </button>
                    {reportTab === 'income-expense' && (
                        <>
                            <div className="period-selector" style={{ margin: 0 }}>
                                {(['monthly', 'quarterly', 'yearly'] as Period[]).map(p => (
                                    <button
                                        key={p}
                                        className={`period-selector__btn ${period === p ? 'period-selector__btn--active' : ''}`}
                                        onClick={() => setPeriod(p)}
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <label style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>From</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    style={{ width: 140 }}
                                />
                                <label style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>To</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    style={{ width: 140 }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {reportTab === 'balance-sheet' ? (
                balanceSheetLoading ? (
                    <div className="card" style={{ minHeight: 300 }} />
                ) : (
                    <BalanceSheetView balanceSheet={balanceSheet} plReport={plReport} currencySymbol={getCurrencySymbol(defaultCurrency)} />
                )
            ) : loading ? (
                <div className="card" style={{ minHeight: 300 }} />
            ) : (
                <div className="page__sections" data-tab="income-expense">
                    {/* Income vs Expenses (combined) */}
                    <div className="chart-card">
                        <div className="chart-card__header">
                            <div>
                                <h3 className="chart-card__title">Income vs Expenses</h3>
                                <p className="chart-card__subtitle">{period.charAt(0).toUpperCase() + period.slice(1)} comparison</p>
                            </div>
                        </div>
                        {chartData.length > 0 ? (
                            <BarChart data={chartData} height={280} currencySymbol={getCurrencySymbol(defaultCurrency)} />
                        ) : (
                            <div className="card__empty">No data available for this period</div>
                        )}
                    </div>

                    {/* Income only */}
                    <div className="chart-card">
                        <div className="chart-card__header">
                            <div>
                                <h3 className="chart-card__title">Income</h3>
                                <p className="chart-card__subtitle">{period.charAt(0).toUpperCase() + period.slice(1)} income</p>
                            </div>
                        </div>
                        {chartData.length > 0 ? (
                            <BarChart data={chartData} height={280} variant="income" currencySymbol={getCurrencySymbol(defaultCurrency)} />
                        ) : (
                            <div className="card__empty">No data available for this period</div>
                        )}
                    </div>

                    {/* Expenses only */}
                    <div className="chart-card">
                        <div className="chart-card__header">
                            <div>
                                <h3 className="chart-card__title">Expenses</h3>
                                <p className="chart-card__subtitle">{period.charAt(0).toUpperCase() + period.slice(1)} expenses</p>
                            </div>
                        </div>
                        {chartData.length > 0 ? (
                            <BarChart data={chartData} height={280} variant="expense" currencySymbol={getCurrencySymbol(defaultCurrency)} />
                        ) : (
                            <div className="card__empty">No data available for this period</div>
                        )}
                    </div>

                    {/* Savings by period */}
                    <div className="chart-card">
                        <div className="chart-card__header">
                            <div>
                                <h3 className="chart-card__title">Savings</h3>
                                <p className="chart-card__subtitle">{period.charAt(0).toUpperCase() + period.slice(1)} savings (income − expense)</p>
                            </div>
                        </div>
                        {chartData.length > 0 ? (
                            <BarChart data={chartData} height={280} variant="savings" currencySymbol={getCurrencySymbol(defaultCurrency)} />
                        ) : (
                            <div className="card__empty">No data available for this period</div>
                        )}
                    </div>

                    {/* Summary Table */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
                            <h3 className="chart-card__title" style={{ margin: 0 }}>Period Summary</h3>
                        </div>
                        {(data?.summary?.length || 0) > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Period</th>
                                        <th style={{ textAlign: 'right' }}>Income</th>
                                        <th style={{ textAlign: 'right' }}>Expenses</th>
                                        <th style={{ textAlign: 'right' }}>Savings</th>
                                        <th style={{ textAlign: 'right' }}>Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data!.summary.map((row) => {
                                        const savings = row.income - row.expense
                                        const rate = row.income > 0 ? (savings / row.income * 100) : 0
                                        return (
                                            <tr key={row.period}>
                                                <td style={{ fontWeight: 600 }}>
                                                    {formatPeriodLabel(row.period, period)}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span className="text-mono text-income" style={{ fontWeight: 600 }}>
                                                        {getCurrencySymbol(defaultCurrency)}{Number(row.income).toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span className="text-mono text-expense" style={{ fontWeight: 600 }}>
                                                        {getCurrencySymbol(defaultCurrency)}{Number(row.expense).toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span
                                                        className="text-mono font-bold"
                                                        style={{ color: savings >= 0 ? '#22c55e' : '#ef4444' }}
                                                    >
                                                        {getCurrencySymbol(defaultCurrency)}{Number(savings).toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span
                                                        className="text-mono"
                                                        style={{
                                                            fontSize: 12,
                                                            padding: '2px 8px',
                                                            borderRadius: 'var(--radius-full)',
                                                            background: rate >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                                            color: rate >= 0 ? '#22c55e' : '#ef4444',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {rate.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="card__empty">No data available</div>
                        )}
                    </div>

                    {/* Income by source (pivot) */}
                    {allSources.length > 0 && data?.summary && (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
                                <h3 className="chart-card__title" style={{ margin: 0 }}>Income by Source</h3>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Source</th>
                                            {data.summary.slice(0, 6).map(s => (
                                                <th key={s.period} style={{ textAlign: 'right' }}>
                                                    {formatPeriodLabel(s.period, period)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allSources.map(src => (
                                            <tr key={src}>
                                                <td>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{
                                                            width: 8, height: 8, borderRadius: '50%',
                                                            background: (data.incomeBySource?.find(r => r.source === src)?.color) || '#6366f1'
                                                        }} />
                                                        <span style={{ fontWeight: 600 }}>{src}</span>
                                                    </span>
                                                </td>
                                                {data.summary.slice(0, 6).map(s => {
                                                    const val = incomeByPeriod.get(s.period)?.get(src)?.total || 0
                                                    return (
                                                        <td key={s.period} style={{ textAlign: 'right' }}>
                                                            <span className="text-mono text-income" style={{ fontSize: 13, fontWeight: val > 0 ? 600 : 400 }}>
                                                                {val > 0 ? `${getCurrencySymbol(defaultCurrency)}${Number(val).toLocaleString('en-IN')}` : '—'}
                                                            </span>
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Category-wise Breakdown Table */}
                    {allCategories.length > 0 && (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
                                <h3 className="chart-card__title" style={{ margin: 0 }}>Category-wise Expenses</h3>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            {data!.summary.slice(0, 6).map(s => (
                                                <th key={s.period} style={{ textAlign: 'right' }}>
                                                    {formatPeriodLabel(s.period, period)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allCategories.map(cat => (
                                            <tr key={cat}>
                                                <td>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{
                                                            width: 8, height: 8, borderRadius: '50%',
                                                            background: categoryColors.get(cat) || '#6366f1'
                                                        }} />
                                                        <span style={{ fontWeight: 600 }}>{cat}</span>
                                                    </span>
                                                </td>
                                                {data!.summary.slice(0, 6).map(s => {
                                                    const val = categoryByPeriod.get(s.period)?.get(cat)?.total || 0
                                                    return (
                                                        <td key={s.period} style={{ textAlign: 'right' }}>
                                                            <span className="text-mono" style={{ fontSize: 13, fontWeight: val > 0 ? 600 : 400, color: val > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                                                                {val > 0 ? `${getCurrencySymbol(defaultCurrency)}${Number(val).toLocaleString('en-IN')}` : '—'}
                                                            </span>
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function BalanceSheetView({
    balanceSheet,
    plReport,
    currencySymbol,
}: {
    balanceSheet: BalanceSheetData | null
    plReport: PlReport | null
    currencySymbol: string
}) {
    if (!balanceSheet) {
        return (
            <div className="card">
                <div className="card__empty">No balance sheet data. Add accounts to see assets and liabilities.</div>
            </div>
        )
    }
    const { assets, liabilities, totalAssets, totalLiabilities } = balanceSheet
    const netPl = plReport?.netPl ?? 0
    const netProfit = netPl > 0 ? netPl : 0
    const netLoss = netPl < 0 ? Math.abs(netPl) : 0
    const totalEquityAndLiabilities = totalLiabilities + netProfit
    const tallies = Math.abs(totalAssets - totalEquityAndLiabilities) < 0.01

    const capitalItems = liabilities.filter(a => a.type === 'capital')
    const otherLiabilities = liabilities.filter(a => a.type !== 'capital' && a.type !== 'equity')

    return (
        <div className="balance-sheet">
            <div className="balance-sheet__header">
                <h3 className="balance-sheet__title">Balance Sheet</h3>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    As on date · Assets = Liabilities + Equity
                </span>
            </div>
            <div className="balance-sheet__body">
                <div className="balance-sheet__column balance-sheet__column--income">
                    <h4 className="balance-sheet__column-title">Assets</h4>
                    {assets.length === 0 ? (
                        <div className="balance-sheet__row">
                            <span className="balance-sheet__row-label">No asset accounts</span>
                            <span className="balance-sheet__row-value">—</span>
                        </div>
                    ) : (
                        assets.map(a => (
                            <div key={a.id} className="balance-sheet__row">
                                <span className="balance-sheet__row-label">
                                    {a.name}
                                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}> ({a.type.replace(/_/g, ' ')})</span>
                                </span>
                                <span className="balance-sheet__row-value text-income">
                                    {currencySymbol}{Number(a.balance).toLocaleString('en-IN')}
                                </span>
                            </div>
                        ))
                    )}
                    <div className="balance-sheet__row" style={{ borderTop: '2px solid var(--color-border)', paddingTop: 12, marginTop: 4, fontWeight: 700 }}>
                        <span className="balance-sheet__row-label">Total Assets</span>
                        <span className="balance-sheet__row-value text-income" style={{ fontSize: 15 }}>
                            {currencySymbol}{Number(totalAssets).toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
                <div className="balance-sheet__column balance-sheet__column--expense">
                    <h4 className="balance-sheet__column-title">Liabilities & Equity</h4>
                    {capitalItems.length > 0 && (
                        <>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Capital</div>
                            {capitalItems.map(a => (
                                <div key={a.id} className="balance-sheet__row">
                                    <span className="balance-sheet__row-label">{a.name}</span>
                                    <span className="balance-sheet__row-value text-expense">
                                        {currencySymbol}{Number(a.balance).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            ))}
                        </>
                    )}
                    {otherLiabilities.length > 0 && (
                        <>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', margin: '12px 0 4px', textTransform: 'uppercase' }}>Other liabilities</div>
                            {otherLiabilities.map(a => (
                                <div key={a.id} className="balance-sheet__row">
                                    <span className="balance-sheet__row-label">{a.name}</span>
                                    <span className="balance-sheet__row-value text-expense">
                                        {currencySymbol}{Number(a.balance).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            ))}
                        </>
                    )}
                    {(netProfit > 0 || netLoss > 0) && (
                        <div className="balance-sheet__row" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                            <span className="balance-sheet__row-label">
                                {netProfit > 0 ? 'Net Profit' : 'Net Loss'}
                            </span>
                            <span
                                className={`balance-sheet__row-value ${netProfit > 0 ? 'text-income' : 'text-expense'}`}
                                style={{ fontWeight: 700 }}
                            >
                                {netProfit > 0
                                    ? `${currencySymbol}${Number(netProfit).toLocaleString('en-IN')}`
                                    : `(${currencySymbol}${Number(netLoss).toLocaleString('en-IN')})`}
                            </span>
                        </div>
                    )}
                    <div className="balance-sheet__row" style={{ borderTop: '2px solid var(--color-border)', paddingTop: 12, marginTop: 4, fontWeight: 700 }}>
                        <span className="balance-sheet__row-label">Total Liabilities & Equity</span>
                        <span className="balance-sheet__row-value text-expense" style={{ fontSize: 15 }}>
                            {currencySymbol}{Number(totalEquityAndLiabilities).toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            </div>
            <div className="balance-sheet__footer">
                <span className="balance-sheet__footer-label">
                    {tallies ? '✓ Balances tally' : 'Difference'}
                </span>
                <span
                    className={`balance-sheet__footer-value ${tallies ? 'balance-sheet__footer-value--positive' : 'balance-sheet__footer-value--negative'}`}
                    style={{ fontSize: tallies ? 16 : 20 }}
                >
                    {tallies
                        ? `${currencySymbol}${Number(totalAssets).toLocaleString('en-IN')} = ${currencySymbol}${Number(totalEquityAndLiabilities).toLocaleString('en-IN')}`
                        : `${currencySymbol}${Number(Math.abs(totalAssets - totalEquityAndLiabilities)).toLocaleString('en-IN')} off`}
                </span>
            </div>
        </div>
    )
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatPeriodLabel(period: string, type: Period): string {
    if (type === 'monthly') {
        const [year, month] = period.split('-')
        return `${MONTH_NAMES[parseInt(month) - 1]} ${year.slice(2)}`
    }
    if (type === 'quarterly') {
        return period.replace('-', ' ')
    }
    return period
}

export default Reports
