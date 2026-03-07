import { useState, useEffect } from 'react'
import { Plus, X, Edit3, Trash2 } from 'lucide-react'
import type { Category } from '../types'

const COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f97316', '#eab308', '#ec4899', '#3b82f6', '#8b5cf6', '#06b6d4', '#64748b']

function Categories() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Category | null>(null)
    const [formName, setFormName] = useState('')
    const [formType, setFormType] = useState<'income' | 'expense'>('expense')
    const [formColor, setFormColor] = useState(COLORS[0])
    const [formParentId, setFormParentId] = useState<number | ''>('')
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

    useEffect(() => {
        load()
    }, [])

    async function load() {
        setLoading(true)
        try {
            const data = await window.api.getCategories()
            setCategories(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    function openAdd() {
        setEditing(null)
        setFormName('')
        setFormType('expense')
        setFormColor(COLORS[0])
        setFormParentId('')
        setModalOpen(true)
    }

    function openEdit(cat: Category) {
        setEditing(cat)
        setFormName(cat.name)
        setFormType(cat.type as 'income' | 'expense')
        setFormColor(cat.color || COLORS[0])
        setFormParentId(cat.parent_id ?? '')
        setModalOpen(true)
    }

    async function handleSave() {
        if (!formName.trim()) return
        try {
            if (editing) {
                await window.api.updateCategory(editing.id, {
                    name: formName.trim(),
                    type: formType,
                    color: formColor,
                    parent_id: formParentId === '' ? null : formParentId,
                })
            } else {
                await window.api.createCategory({
                    name: formName.trim(),
                    type: formType,
                    color: formColor,
                    parent_id: formParentId === '' ? null : (formParentId as number),
                })
            }
            setModalOpen(false)
            load()
        } catch (err) {
            console.error(err)
        }
    }

    async function handleDelete(id: number) {
        try {
            await window.api.deleteCategory(id)
            setDeleteConfirm(null)
            load()
        } catch (err) {
            console.error(err)
        }
    }

    const parentCandidates = categories.filter(c => c.type === formType && c.id !== editing?.id)

    if (loading) {
        return (
            <div className="page">
                <div className="card" style={{ minHeight: 300 }} />
            </div>
        )
    }

    const byType = (type: string) => categories.filter(c => c.type === type)
    const incomeCats = byType('income')
    const expenseCats = byType('expense')

    return (
        <div className="page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Categories</h2>
                <button className="btn btn--primary" onClick={openAdd}>
                    <Plus size={16} />
                    Add Category
                </button>
            </div>

            <div className="page__grid--2">
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                        <h3 className="chart-card__title" style={{ margin: 0 }}>Income</h3>
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 12 }}>
                        {incomeCats.map(c => (
                            <li key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: c.color }} />
                                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                                    {c.parent_id && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>(sub)</span>}
                                </span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="btn btn--ghost btn--icon" onClick={() => openEdit(c)}><Edit3 size={14} /></button>
                                    <button className="btn btn--ghost btn--icon" onClick={() => setDeleteConfirm(c.id)}><Trash2 size={14} /></button>
                                </div>
                            </li>
                        ))}
                        {incomeCats.length === 0 && <li style={{ padding: 20, color: 'var(--color-text-muted)' }}>No income categories</li>}
                    </ul>
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                        <h3 className="chart-card__title" style={{ margin: 0 }}>Expense</h3>
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 12 }}>
                        {expenseCats.map(c => (
                            <li key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: c.color }} />
                                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                                    {c.parent_id && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>(sub)</span>}
                                </span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="btn btn--ghost btn--icon" onClick={() => openEdit(c)}><Edit3 size={14} /></button>
                                    <button className="btn btn--ghost btn--icon" onClick={() => setDeleteConfirm(c.id)}><Trash2 size={14} /></button>
                                </div>
                            </li>
                        ))}
                        {expenseCats.length === 0 && <li style={{ padding: 20, color: 'var(--color-text-muted)' }}>No expense categories</li>}
                    </ul>
                </div>
            </div>

            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">{editing ? 'Edit Category' : 'Add Category'}</h2>
                            <button className="modal__close" onClick={() => setModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="modal__body">
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input type="text" className="form-input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Category name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="form-select" value={formType} onChange={e => setFormType(e.target.value as 'income' | 'expense')}>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
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
                                                border: formColor === c ? '3px solid var(--color-text-primary)' : '2px solid transparent',
                                            }}
                                            onClick={() => setFormColor(c)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                    <label className="form-label">Parent category (sub-category)</label>
                                    <select className="form-select" value={formParentId} onChange={e => setFormParentId(e.target.value ? parseInt(e.target.value) : '')}>
                                        <option value="">None</option>
                                        {parentCandidates.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
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
                            <h2 className="modal__title">Delete category?</h2>
                            <button className="modal__close" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
                        </div>
                        <div className="modal__body">
                            <p style={{ color: 'var(--color-text-secondary)' }}>Transactions using this category may need to be re-assigned.</p>
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

export default Categories
