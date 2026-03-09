import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, AlertTriangle, Check } from 'lucide-react'
import { getCurrencySymbol } from '../constants/currencies'
import type { SavingGoal, SavingGoalAllocation, SavingsPool } from '../types'

const COLORS = ['#06b6d4', '#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#64748b']
const EMOJI_PRESETS = ['🎯', '✈️', '🏠', '🚗', '💍', '🎓', '🏖️', '💰', '🛡️', '📱', '🎮', '👶']

const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

export default function SavingsGoals() {
    const [goals, setGoals] = useState<SavingGoal[]>([])
    const [pool, setPool] = useState<SavingsPool>({ totalSavings: 0, totalAllocated: 0, unallocated: 0 })
    const [loading, setLoading] = useState(true)
    const [currency, setCurrency] = useState('USD')

    // Goal Modal (create/edit)
    const [goalModal, setGoalModal] = useState(false)
    const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null)
    const [goalForm, setGoalForm] = useState({ name: '', emoji: '🎯', color: '#06b6d4', target_amount: '', deadline: '' })

    // Allocation Modal
    const [allocModal, setAllocModal] = useState(false)
    const [allocGoal, setAllocGoal] = useState<SavingGoal | null>(null)
    const [allocations, setAllocations] = useState<SavingGoalAllocation[]>([])
    const [allocForm, setAllocForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })

    // Confirm Delete
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

    const currencySymbol = getCurrencySymbol(currency)

    const loadData = async () => {
        try {
            const [goalsData, poolData, curr] = await Promise.all([
                window.api.getSavingGoals(),
                window.api.getSavingsPool(),
                window.api.getDefaultCurrency()
            ])
            setGoals(goalsData)
            setPool(poolData)
            setCurrency(curr || 'USD')
        } catch (e) {
            console.error('Failed to load savings goals:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    // --- Goal Modal Handlers ---

    function openCreateGoalModal() {
        setEditingGoal(null)
        setGoalForm({ name: '', emoji: '🎯', color: '#06b6d4', target_amount: '', deadline: '' })
        setGoalModal(true)
    }

    function openEditGoalModal(goal: SavingGoal) {
        setEditingGoal(goal)
        setGoalForm({
            name: goal.name,
            emoji: goal.emoji || '🎯',
            color: goal.color || '#06b6d4',
            target_amount: String(goal.target_amount),
            deadline: goal.deadline || ''
        })
        setGoalModal(true)
    }

    async function handleSaveGoal() {
        if (!goalForm.name.trim()) return
        const target = parseFloat(goalForm.target_amount)
        if (isNaN(target) || target <= 0) return

        try {
            if (editingGoal) {
                await window.api.updateSavingGoal(editingGoal.id, {
                    name: goalForm.name.trim(),
                    target_amount: target,
                    emoji: goalForm.emoji,
                    color: goalForm.color,
                    deadline: goalForm.deadline || null
                })
            } else {
                await window.api.createSavingGoal({
                    name: goalForm.name.trim(),
                    target_amount: target,
                    emoji: goalForm.emoji,
                    color: goalForm.color,
                    deadline: goalForm.deadline || null
                })
            }
            setGoalModal(false)
            loadData()
        } catch (err) {
            console.error(err)
        }
    }

    // --- Allocation Modal Handlers ---

    const openAllocModal = async (goal: SavingGoal) => {
        setAllocGoal(goal)
        setAllocForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
        try {
            const allocs = await window.api.getSavingGoalAllocations(goal.id)
            setAllocations(allocs)
        } catch (e) {
            console.error('Failed to load allocations:', e)
            setAllocations([])
        }
        setAllocModal(true)  // Open AFTER data is fetched
    }

    const handleAddAllocation = async () => {
        if (!allocGoal) return
        const amount = parseFloat(allocForm.amount)
        if (isNaN(amount) || amount <= 0) return
        try {
            await window.api.addSavingGoalAllocation({
                goal_id: allocGoal.id,
                amount,
                date: allocForm.date,
                note: allocForm.note || undefined
            })
            // Fetch updated data in parallel
            const [allocs, goalsData, poolData] = await Promise.all([
                window.api.getSavingGoalAllocations(allocGoal.id),
                window.api.getSavingGoals(),
                window.api.getSavingsPool()
            ])
            setAllocations(allocs)
            setGoals(goalsData)
            setPool(poolData)
            const updated = goalsData.find(g => g.id === allocGoal.id)
            if (updated) setAllocGoal(updated)
            setAllocForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
        } catch (e) {
            console.error('Failed to add allocation:', e)
        }
    }

    const handleDeleteAllocation = async (id: number) => {
        if (!allocGoal) return
        try {
            await window.api.deleteSavingGoalAllocation(id)
            const [allocs, goalsData, poolData] = await Promise.all([
                window.api.getSavingGoalAllocations(allocGoal.id),
                window.api.getSavingGoals(),
                window.api.getSavingsPool()
            ])
            setAllocations(allocs)
            setGoals(goalsData)
            setPool(poolData)
            const updated = goalsData.find(g => g.id === allocGoal.id)
            if (updated) setAllocGoal(updated)
        } catch (e) {
            console.error('Failed to delete allocation:', e)
        }
    }

    // --- Delete Goal ---

    async function handleDeleteGoal(id: number) {
        try {
            await window.api.deleteSavingGoal(id)
            setConfirmDelete(null)
            loadData()
        } catch (err) {
            console.error(err)
        }
    }

    // --- Deadline helpers ---

    function getDeadlineInfo(deadline: string | null) {
        if (!deadline) return null
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const [y, m, d] = deadline.split('-').map(Number)
        const dl = new Date(y, m - 1, d)
        const diffMs = dl.getTime() - today.getTime()
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return { text: 'Overdue', color: '#ef4444', days: diffDays }
        if (diffDays === 0) return { text: 'Due today', color: '#f59e0b', days: 0 }
        if (diffDays <= 14) return { text: `${diffDays} day${diffDays === 1 ? '' : 's'} left`, color: '#f59e0b', days: diffDays }
        if (diffDays <= 30) return { text: `${diffDays} days left`, color: '#f59e0b', days: diffDays }
        return { text: deadline, color: 'var(--color-text-muted)', days: diffDays }
    }

    // --- Loading ---

    if (loading) {
        return (
            <div className="page">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                    {[1, 2, 3].map(i => <div key={i} className="summary-card" style={{ minHeight: 80 }} />)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {[1, 2, 3].map(i => <div key={i} className="budget-card" style={{ minHeight: 180 }} />)}
                </div>
            </div>
        )
    }

    return (
        <div className="page" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
            {/* Summary Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div className="savings-pool-card savings-pool-card--total">
                    <div className="savings-pool-card__label">Total Savings Pool</div>
                    <div className="savings-pool-card__value">
                        {currencySymbol}{formatAmount(pool.totalSavings)}
                    </div>
                </div>
                <div className="savings-pool-card savings-pool-card--allocated">
                    <div className="savings-pool-card__label">Allocated to Goals</div>
                    <div className="savings-pool-card__value">
                        {currencySymbol}{formatAmount(pool.totalAllocated)}
                    </div>
                </div>
                <div className="savings-pool-card savings-pool-card--unallocated">
                    <div className="savings-pool-card__label">Unallocated</div>
                    <div className="savings-pool-card__value">
                        {currencySymbol}{formatAmount(pool.unallocated)}
                    </div>
                </div>
            </div>

            {/* Header with Add button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Your Goals</h3>
                <button className="btn btn--primary btn--sm" onClick={openCreateGoalModal}>
                    <Plus size={16} /> New Goal
                </button>
            </div>

            {/* Goals Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {goals.length === 0 ? (
                    <div style={{
                        gridColumn: '1 / -1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 60,
                        background: 'var(--color-bg-card)',
                        borderRadius: 12,
                        border: '1px solid var(--color-border)'
                    }}>
                        <span style={{ fontSize: 48, marginBottom: 16 }}>🎯</span>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20, textAlign: 'center' }}>
                            No savings goals yet. Create your first goal to start tracking!
                        </p>
                        <button className="btn btn--primary" onClick={openCreateGoalModal}>
                            <Plus size={16} /> Create First Goal
                        </button>
                    </div>
                ) : (
                    goals.map((goal, idx) => {
                        const pct = goal.target_amount > 0 ? Math.min((goal.allocated_amount / goal.target_amount) * 100, 100) : 0
                        const rawPct = goal.target_amount > 0 ? (goal.allocated_amount / goal.target_amount) * 100 : 0
                        const isComplete = goal.allocated_amount >= goal.target_amount && goal.target_amount > 0
                        const remaining = Math.max(goal.target_amount - goal.allocated_amount, 0)
                        const deadlineInfo = getDeadlineInfo(goal.deadline)

                        return (
                            <div
                                key={goal.id}
                                className="savings-goal-card"
                                style={{ animationDelay: `${idx * 60}ms` }}
                            >
                                {/* Header */}
                                <div className="savings-goal-card__header">
                                    <div className="savings-goal-card__title-row">
                                        <span className="savings-goal-card__emoji">{goal.emoji || '🎯'}</span>
                                        <span className="savings-goal-card__name">{goal.name}</span>
                                    </div>
                                    <div className="savings-goal-card__actions">
                                        <button className="btn btn--ghost btn--icon" onClick={() => openEditGoalModal(goal)} title="Edit goal">
                                            <Pencil size={14} />
                                        </button>
                                        <button className="btn btn--ghost btn--icon" onClick={() => openAllocModal(goal)} title="Manage allocations">
                                            <span style={{ fontSize: 14 }}>💰</span>
                                        </button>
                                        <button className="btn btn--ghost btn--icon" onClick={() => setConfirmDelete(goal.id)} title="Delete goal">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Amounts */}
                                <div className="savings-goal-card__amounts">
                                    <span className="savings-goal-card__allocated">
                                        {currencySymbol}{formatAmount(goal.allocated_amount)}
                                    </span>
                                    <span className="savings-goal-card__target">
                                        / {currencySymbol}{formatAmount(goal.target_amount)}
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div className="savings-goal-card__progress">
                                    <div
                                        className="savings-goal-card__progress-fill"
                                        style={{
                                            width: `${pct}%`,
                                            background: isComplete
                                                ? 'linear-gradient(90deg, #22c55e, #10b981)'
                                                : `linear-gradient(90deg, ${goal.color}, ${goal.color}dd)`,
                                            animationDelay: `${idx * 60}ms`
                                        }}
                                    />
                                </div>

                                {/* Meta row */}
                                <div className="savings-goal-card__meta">
                                    <span className="savings-goal-card__pct" style={{ color: isComplete ? '#22c55e' : undefined }}>
                                        {isComplete ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Check size={14} /> Complete!
                                            </span>
                                        ) : (
                                            `${rawPct.toFixed(1)}%`
                                        )}
                                    </span>
                                    {deadlineInfo && !isComplete && (
                                        <span className={`savings-goal-card__deadline${deadlineInfo.days < 0 ? ' savings-goal-card__deadline--overdue' : deadlineInfo.days <= 30 ? ' savings-goal-card__deadline--urgent' : ''}`}>
                                            {deadlineInfo.days < 0 && <AlertTriangle size={12} />}
                                            {deadlineInfo.text}
                                        </span>
                                    )}
                                </div>

                                {/* Remaining */}
                                <div className="savings-goal-card__remaining">
                                    {isComplete ? (
                                        <span style={{ color: '#22c55e' }}>Goal reached!</span>
                                    ) : (
                                        <span><strong>{currencySymbol}{formatAmount(remaining)}</strong> remaining</span>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Goal Modal (create/edit) */}
            {goalModal && (
                <div className="modal-overlay" onClick={() => setGoalModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">{editingGoal ? 'Edit Goal' : 'New Savings Goal'}</h2>
                            <button className="modal__close" onClick={() => setGoalModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal__body">
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={goalForm.name}
                                    onChange={e => setGoalForm({ ...goalForm, name: e.target.value })}
                                    placeholder="e.g. Holiday fund"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Emoji</label>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                    {EMOJI_PRESETS.map(em => (
                                        <button
                                            key={em}
                                            type="button"
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 8,
                                                fontSize: 18,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: goalForm.emoji === em ? '2px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                                                background: goalForm.emoji === em ? 'var(--color-bg-hover)' : 'transparent',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setGoalForm({ ...goalForm, emoji: em })}
                                        >
                                            {em}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={goalForm.emoji}
                                    onChange={e => setGoalForm({ ...goalForm, emoji: e.target.value })}
                                    placeholder="Or type a custom emoji"
                                    maxLength={4}
                                    style={{ width: 120 }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Target Amount</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={goalForm.target_amount}
                                    onChange={e => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                                    placeholder="0"
                                    min="1"
                                    step="1"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Color</label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 8,
                                                background: c,
                                                border: goalForm.color === c ? '3px solid var(--color-text-primary)' : '2px solid transparent',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setGoalForm({ ...goalForm, color: c })}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Deadline (optional)</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={goalForm.deadline}
                                    onChange={e => setGoalForm({ ...goalForm, deadline: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--ghost" onClick={() => setGoalModal(false)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleSaveGoal}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Allocation Modal */}
            {allocModal && allocGoal && (
                <div className="modal-overlay" onClick={() => setAllocModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal__header">
                            <h2 className="modal__title">
                                <span style={{ marginRight: 8 }}>{allocGoal.emoji || '🎯'}</span>
                                {allocGoal.name}
                            </h2>
                            <button className="modal__close" onClick={() => setAllocModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal__body">
                            {/* Current progress */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Progress</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                        {currencySymbol}{formatAmount(allocGoal.allocated_amount)} / {currencySymbol}{formatAmount(allocGoal.target_amount)}
                                    </span>
                                </div>
                                <div className="progress">
                                    <div
                                        className="progress__fill"
                                        style={{
                                            width: `${allocGoal.target_amount > 0 ? Math.min((allocGoal.allocated_amount / allocGoal.target_amount) * 100, 100) : 0}%`,
                                            background: `linear-gradient(90deg, ${allocGoal.color}, ${allocGoal.color}dd)`,
                                            animation: 'progressFill 0.6s ease-out both'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Add Allocation form */}
                            <div style={{ padding: 16, background: 'var(--color-bg-hover)', borderRadius: 10, marginBottom: 20 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-primary)' }}>
                                    Add Allocation
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1 1 120px' }}>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={allocForm.amount}
                                            onChange={e => setAllocForm({ ...allocForm, amount: e.target.value })}
                                            placeholder="Amount"
                                            min="1"
                                            step="1"
                                        />
                                    </div>
                                    <div style={{ flex: '1 1 130px' }}>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={allocForm.date}
                                            onChange={e => setAllocForm({ ...allocForm, date: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ flex: '2 1 180px' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={allocForm.note}
                                            onChange={e => setAllocForm({ ...allocForm, note: e.target.value })}
                                            placeholder="Note (optional)"
                                        />
                                    </div>
                                    <button className="btn btn--primary btn--sm" onClick={handleAddAllocation} style={{ alignSelf: 'flex-start' }}>
                                        <Plus size={14} /> Add
                                    </button>
                                </div>
                                {allocForm.amount && parseFloat(allocForm.amount) > pool.unallocated && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: '#f59e0b' }}>
                                        <AlertTriangle size={14} />
                                        This exceeds your unallocated savings ({currencySymbol}{formatAmount(pool.unallocated)})
                                    </div>
                                )}
                            </div>

                            {/* Existing Allocations */}
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-primary)' }}>
                                    Allocations ({allocations.length})
                                </div>
                                {allocations.length === 0 ? (
                                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                                        No allocations yet
                                    </div>
                                ) : (
                                    <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                                        {allocations.map(alloc => (
                                            <div
                                                key={alloc.id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '10px 0',
                                                    borderBottom: '1px solid var(--color-border)'
                                                }}
                                            >
                                                <div>
                                                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 14 }}>
                                                        {currencySymbol}{formatAmount(alloc.amount)}
                                                    </span>
                                                    <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                                                        {alloc.date}
                                                    </span>
                                                    {alloc.note && (
                                                        <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                                            {alloc.note}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    className="btn btn--ghost btn--icon"
                                                    onClick={() => handleDeleteAllocation(alloc.id)}
                                                    title="Remove allocation"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--ghost" onClick={() => setAllocModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Dialog */}
            {confirmDelete !== null && (
                <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Delete goal?</h2>
                            <button className="modal__close" onClick={() => setConfirmDelete(null)}><X size={18} /></button>
                        </div>
                        <div className="modal__body">
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                Are you sure you want to delete this goal? All allocations will be removed.
                            </p>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="btn btn--danger" onClick={() => handleDeleteGoal(confirmDelete)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
