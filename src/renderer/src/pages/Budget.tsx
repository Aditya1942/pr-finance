import { useState, useEffect } from 'react'
import { Save, AlertTriangle } from 'lucide-react'
import type { BudgetItem } from '../types'

function Budget() {
    const [budgets, setBudgets] = useState<BudgetItem[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editAmount, setEditAmount] = useState('')

    useEffect(() => {
        loadBudgets()
    }, [])

    async function loadBudgets() {
        try {
            const data = await window.api.getBudgetOverview()
            setBudgets(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function saveBudget(id: number) {
        const amount = parseFloat(editAmount)
        if (isNaN(amount) || amount < 0) return
        try {
            await window.api.updateCategoryBudget(id, amount)
            setEditingId(null)
            loadBudgets()
        } catch (err) {
            console.error(err)
        }
    }

    function startEdit(item: BudgetItem) {
        setEditingId(item.id)
        setEditAmount(String(item.budget_amount || ''))
    }

    if (loading) {
        return (
            <div className="page">
                <div className="page__grid--3">
                    {[1, 2, 3].map(i => <div key={i} className="budget-card" style={{ minHeight: 150 }} />)}
                </div>
            </div>
        )
    }

    // Summary
    const totalBudget = budgets.reduce((s, b) => s + (b.budget_amount || 0), 0)
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
    const overBudgetCount = budgets.filter(b => b.budget_amount > 0 && b.spent > b.budget_amount).length

    return (
        <div className="page">
            {/* Summary strip */}
            <div className="page__grid">
                <div className="summary-card summary-card--balance">
                    <div className="summary-card__label">Total Budget</div>
                    <div className="summary-card__value" style={{ fontSize: 26 }}>
                        ₹{totalBudget.toLocaleString('en-IN')}
                    </div>
                </div>
                <div className="summary-card summary-card--expense">
                    <div className="summary-card__label">Total Spent (This Month)</div>
                    <div className="summary-card__value" style={{ fontSize: 26 }}>
                        ₹{totalSpent.toLocaleString('en-IN')}
                    </div>
                </div>
                <div className={`summary-card ${overBudgetCount > 0 ? 'summary-card--expense' : 'summary-card--savings'}`}>
                    <div className="summary-card__label">Over Budget</div>
                    <div className="summary-card__value" style={{ fontSize: 26 }}>
                        {overBudgetCount} {overBudgetCount === 1 ? 'Category' : 'Categories'}
                    </div>
                </div>
            </div>

            {/* Budget Cards Grid */}
            <div className="page__grid--3">
                {budgets.map((item, idx) => {
                    const pct = item.budget_amount > 0 ? Math.min((item.spent / item.budget_amount) * 100, 100) : 0
                    const isOver = item.budget_amount > 0 && item.spent > item.budget_amount
                    const displayPct = item.budget_amount > 0 ? ((item.spent / item.budget_amount) * 100).toFixed(1) : '—'

                    return (
                        <div
                            key={item.id}
                            className="budget-card"
                            style={{ animationDelay: `${idx * 60}ms` }}
                        >
                            <div className="budget-card__header">
                                <div className="budget-card__name">
                                    <span className="budget-card__dot" style={{ background: item.color }} />
                                    {item.name}
                                </div>
                                <div className="budget-card__amounts">
                                    <div className={`budget-card__spent ${isOver ? 'text-expense' : ''}`}>
                                        ₹{item.spent.toLocaleString('en-IN')}
                                    </div>
                                    <div className="budget-card__budget">
                                        / ₹{(item.budget_amount || 0).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>

                            <div className={`progress ${isOver ? 'progress--over' : ''}`}>
                                <div
                                    className="progress__fill"
                                    style={{
                                        width: `${pct}%`,
                                        background: isOver
                                            ? 'linear-gradient(90deg, #ef4444, #f43f5e)'
                                            : pct > 75
                                                ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                                                : `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                                        animation: `progressFill 0.8s ease-out ${idx * 60}ms both`
                                    }}
                                />
                            </div>

                            <div className="budget-card__percentage">
                                <span>{displayPct}% used</span>
                                {isOver && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444' }}>
                                        <AlertTriangle size={12} /> Over budget!
                                    </span>
                                )}
                            </div>

                            {/* Edit budget */}
                            <div className="budget-card__edit-row">
                                {editingId === item.id ? (
                                    <>
                                        <input
                                            type="number"
                                            className="budget-card__edit-input"
                                            value={editAmount}
                                            onChange={e => setEditAmount(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && saveBudget(item.id)}
                                            placeholder="Budget amount"
                                            autoFocus
                                            min="0"
                                        />
                                        <button className="btn btn--primary btn--sm" onClick={() => saveBudget(item.id)}>
                                            <Save size={12} />
                                        </button>
                                        <button className="btn btn--ghost btn--sm" onClick={() => setEditingId(null)}>
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="btn btn--ghost btn--sm"
                                        style={{ width: '100%' }}
                                        onClick={() => startEdit(item)}
                                    >
                                        {item.budget_amount > 0 ? 'Edit Budget' : 'Set Budget'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Budget
