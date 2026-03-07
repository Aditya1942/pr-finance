import { useState, useEffect } from 'react'
import { Plus, X, Trash2, Check } from 'lucide-react'
import type { Reminder as ReminderType } from '../types'

function Reminders() {
    const [reminders, setReminders] = useState<ReminderType[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [formTitle, setFormTitle] = useState('')
    const [formDueDate, setFormDueDate] = useState('')
    const [formAmount, setFormAmount] = useState('')
    const [formDesc, setFormDesc] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
    const [showPaid, setShowPaid] = useState(false)

    useEffect(() => {
        load()
    }, [showPaid])

    async function load() {
        setLoading(true)
        try {
            const data = await window.api.getReminders({ includePaid: showPaid })
            setReminders(data)
            const today = new Date().toISOString().split('T')[0]
            const overdueCount = data.filter((r: ReminderType) => !r.paid_at && r.due_date < today).length
            if (overdueCount > 0) {
                window.api.showNotification({ title: 'PR Finance', body: `${overdueCount} bill(s) overdue` })
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    function openAdd() {
        setFormTitle('')
        setFormDueDate(new Date().toISOString().split('T')[0])
        setFormAmount('')
        setFormDesc('')
        setModalOpen(true)
    }

    async function handleSave() {
        if (!formTitle.trim() || !formDueDate) return
        try {
            await window.api.createReminder({
                title: formTitle.trim(),
                due_date: formDueDate,
                amount: formAmount ? parseFloat(formAmount) : undefined,
                description: formDesc || undefined,
            })
            setModalOpen(false)
            load()
        } catch (err) {
            console.error(err)
        }
    }

    async function markPaid(id: number) {
        try {
            await window.api.markReminderPaid(id)
            load()
        } catch (err) {
            console.error(err)
        }
    }

    async function handleDelete(id: number) {
        try {
            await window.api.deleteReminder(id)
            setDeleteConfirm(null)
            load()
        } catch (err) {
            console.error(err)
        }
    }

    const today = new Date().toISOString().split('T')[0]
    const overdue = reminders.filter(r => !r.paid_at && r.due_date < today)
    const upcoming = reminders.filter(r => !r.paid_at && r.due_date >= today)

    if (loading) {
        return (
            <div className="page">
                <div className="card" style={{ minHeight: 300 }} />
            </div>
        )
    }

    return (
        <div className="page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Bill Reminders</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                        <input type="checkbox" checked={showPaid} onChange={e => setShowPaid(e.target.checked)} />
                        Show paid
                    </label>
                    <button className="btn btn--primary" onClick={openAdd}>
                        <Plus size={16} />
                        Add Reminder
                    </button>
                </div>
            </div>

            {overdue.length > 0 && (
                <div className="card" style={{ borderLeft: '4px solid var(--color-accent-red)' }}>
                    <h3 className="chart-card__title" style={{ marginBottom: 12, color: 'var(--color-accent-red)' }}>Overdue</h3>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {overdue.map(r => (
                            <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                                <div>
                                    <span style={{ fontWeight: 700 }}>{r.title}</span>
                                    {r.amount != null && <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)' }}>₹{Number(r.amount).toLocaleString('en-IN')}</span>}
                                    <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--color-text-muted)' }}>Due {r.due_date}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="btn btn--ghost btn--icon" onClick={() => markPaid(r.id)} title="Mark paid"><Check size={16} /></button>
                                    <button className="btn btn--ghost btn--icon" onClick={() => setDeleteConfirm(r.id)}><Trash2 size={14} /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 className="chart-card__title" style={{ margin: 0 }}>Upcoming &amp; Past</h3>
                </div>
                {reminders.length === 0 ? (
                    <div className="card__empty" style={{ padding: 60 }}>No reminders. Add a bill reminder to get notified.</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Due date</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th>Status</th>
                                <th style={{ width: 80 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {reminders.map(r => (
                                <tr key={r.id} style={{ opacity: r.paid_at ? 0.7 : 1 }}>
                                    <td style={{ fontWeight: 600 }}>{r.title}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{r.due_date}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                        {r.amount != null ? `₹${Number(r.amount).toLocaleString('en-IN')}` : '—'}
                                    </td>
                                    <td>
                                        {r.paid_at ? (
                                            <span style={{ fontSize: 12, color: 'var(--color-accent-green)', fontWeight: 600 }}>Paid</span>
                                        ) : r.due_date < today ? (
                                            <span style={{ fontSize: 12, color: 'var(--color-accent-red)', fontWeight: 600 }}>Overdue</span>
                                        ) : (
                                            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Upcoming</span>
                                        )}
                                    </td>
                                    <td>
                                        {!r.paid_at && (
                                            <button className="btn btn--ghost btn--icon" onClick={() => markPaid(r.id)} title="Mark paid"><Check size={14} /></button>
                                        )}
                                        <button className="btn btn--ghost btn--icon" onClick={() => setDeleteConfirm(r.id)}><Trash2 size={14} /></button>
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
                            <h2 className="modal__title">Add Reminder</h2>
                            <button className="modal__close" onClick={() => setModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="modal__body">
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input type="text" className="form-input" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Electricity bill" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Due date</label>
                                <input type="date" className="form-input" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Amount (optional)</label>
                                <input type="number" className="form-input" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0" step="0.01" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes (optional)</label>
                                <input type="text" className="form-input" value={formDesc} onChange={e => setFormDesc(e.target.value)} />
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
                            <h2 className="modal__title">Delete reminder?</h2>
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

export default Reminders
