import { useState, useEffect } from 'react'
import { Plus, X, Edit3, Trash2, Repeat, Pause, Play } from 'lucide-react'
import type { RecurringTemplate, Category } from '../types'

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const

function Recurring() {
    const [templates, setTemplates] = useState<RecurringTemplate[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<RecurringTemplate | null>(null)
    const [formDesc, setFormDesc] = useState('')
    const [formAmount, setFormAmount] = useState('')
    const [formCategory, setFormCategory] = useState<number | ''>('')
    const [formType, setFormType] = useState<'income' | 'expense'>('expense')
    const [formFreq, setFormFreq] = useState<string>('monthly')
    const [formNextRun, setFormNextRun] = useState('')
    const [formEndDate, setFormEndDate] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

    useEffect(() => {
        load()
    }, [])

    async function load() {
        setLoading(true)
        try {
            const [tpls, cats] = await Promise.all([
                window.api.getRecurringTemplates(),
                window.api.getCategories(),
            ])
            setTemplates(tpls)
            setCategories(cats)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    function openAdd() {
        setEditing(null)
        const today = new Date().toISOString().split('T')[0]
        setFormDesc('')
        setFormAmount('')
        setFormCategory('')
        setFormType('expense')
        setFormFreq('monthly')
        setFormNextRun(today)
        setFormEndDate('')
        setModalOpen(true)
    }

    function openEdit(t: RecurringTemplate) {
        setEditing(t)
        setFormDesc(t.description || '')
        setFormAmount(String(t.amount))
        setFormCategory(t.category_id)
        setFormType(t.type as 'income' | 'expense')
        setFormFreq(t.frequency)
        setFormNextRun(t.next_run)
        setFormEndDate(t.end_date || '')
        setModalOpen(true)
    }

    async function handleSave() {
        if (!formAmount || !formCategory || !formNextRun) return
        const amount = parseFloat(formAmount)
        if (isNaN(amount)) return
        try {
            if (editing) {
                await window.api.updateRecurringTemplate(editing.id, {
                    description: formDesc || undefined,
                    amount,
                    category_id: formCategory as number,
                    type: formType,
                    frequency: formFreq,
                    next_run: formNextRun,
                    end_date: formEndDate || null,
                })
            } else {
                await window.api.createRecurringTemplate({
                    description: formDesc || 'Recurring',
                    amount,
                    category_id: formCategory as number,
                    type: formType,
                    frequency: formFreq,
                    next_run: formNextRun,
                    end_date: formEndDate || null,
                })
            }
            setModalOpen(false)
            load()
        } catch (err) {
            console.error(err)
        }
    }

    async function toggleActive(t: RecurringTemplate) {
        try {
            await window.api.updateRecurringTemplate(t.id, { is_active: t.is_active ? 0 : 1 })
            load()
        } catch (err) {
            console.error(err)
        }
    }

    async function handleDelete(id: number) {
        try {
            await window.api.deleteRecurringTemplate(id)
            setDeleteConfirm(null)
            load()
        } catch (err) {
            console.error(err)
        }
    }

    const filteredCategories = categories.filter(c => c.type === formType)
    const upcoming = templates.filter(t => t.is_active && t.next_run >= new Date().toISOString().split('T')[0]).slice(0, 5)

    if (loading) {
        return (
            <div className="page">
                <div className="card" style={{ minHeight: 300 }} />
            </div>
        )
    }

    return (
        <div className="page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Recurring Transactions</h2>
                <button className="btn btn--primary" onClick={openAdd}>
                    <Plus size={16} />
                    Add Recurring
                </button>
            </div>

            {upcoming.length > 0 && (
                <div className="card">
                    <h3 className="chart-card__title" style={{ marginBottom: 12 }}>Upcoming</h3>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {upcoming.map(t => (
                            <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                                <span style={{ fontWeight: 600 }}>{t.description || t.category_name}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: t.type === 'income' ? 'var(--color-accent-green)' : 'var(--color-accent-red)' }}>
                                    {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                                </span>
                                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t.next_run}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {templates.length === 0 ? (
                    <div className="card__empty" style={{ padding: 60 }}>No recurring templates. Add one to auto-generate transactions.</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Frequency</th>
                                <th>Next run</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th style={{ width: 100 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map(t => (
                                <tr key={t.id} style={{ opacity: t.is_active ? 1 : 0.6 }}>
                                    <td style={{ fontWeight: 600 }}>{t.description || t.category_name}</td>
                                    <td>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.category_color }} />
                                            {t.category_name}
                                        </span>
                                    </td>
                                    <td style={{ textTransform: 'capitalize' }}>{t.frequency}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{t.next_run}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }} className={t.type === 'income' ? 'text-income' : 'text-expense'}>
                                        {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn btn--ghost btn--icon" onClick={() => toggleActive(t)} title={t.is_active ? 'Pause' : 'Resume'}>
                                                {t.is_active ? <Pause size={14} /> : <Play size={14} />}
                                            </button>
                                            <button className="btn btn--ghost btn--icon" onClick={() => openEdit(t)}><Edit3 size={14} /></button>
                                            <button className="btn btn--ghost btn--icon" onClick={() => setDeleteConfirm(t.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">{editing ? 'Edit Recurring' : 'Add Recurring'}</h2>
                            <button className="modal__close" onClick={() => setModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="modal__body">
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input type="text" className="form-input" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="e.g. Rent" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="form-select" value={formType} onChange={e => { setFormType(e.target.value as 'income' | 'expense'); setFormCategory('') }}>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-select" value={formCategory} onChange={e => setFormCategory(parseInt(e.target.value))}>
                                    <option value="">Select</option>
                                    {filteredCategories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Amount (₹)</label>
                                    <input type="number" className="form-input" value={formAmount} onChange={e => setFormAmount(e.target.value)} min="0" step="0.01" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Frequency</label>
                                    <select className="form-select" value={formFreq} onChange={e => setFormFreq(e.target.value)}>
                                        {FREQUENCIES.map(f => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Next run date</label>
                                    <input type="date" className="form-input" value={formNextRun} onChange={e => setFormNextRun(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End date (optional)</label>
                                    <input type="date" className="form-input" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleSave}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm !== null && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Delete recurring template?</h2>
                            <button className="modal__close" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn btn--danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Recurring
