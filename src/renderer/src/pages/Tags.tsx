import { useState, useEffect } from 'react'
import { Plus, X, Edit3, Trash2 } from 'lucide-react'
import type { Tag } from '../types'

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#06b6d4']

function Tags() {
    const [tags, setTags] = useState<Tag[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Tag | null>(null)
    const [formName, setFormName] = useState('')
    const [formColor, setFormColor] = useState(COLORS[0])
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

    useEffect(() => {
        load()
    }, [])

    async function load() {
        setLoading(true)
        try {
            const data = await window.api.getTags()
            setTags(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    function openAdd() {
        setEditing(null)
        setFormName('')
        setFormColor(COLORS[tags.length % COLORS.length])
        setModalOpen(true)
    }

    function openEdit(tag: Tag) {
        setEditing(tag)
        setFormName(tag.name)
        setFormColor(tag.color || COLORS[0])
        setModalOpen(true)
    }

    async function handleSave() {
        if (!formName.trim()) return
        try {
            if (editing) {
                await window.api.updateTag(editing.id, { name: formName.trim(), color: formColor })
            } else {
                await window.api.createTag({ name: formName.trim(), color: formColor })
            }
            setModalOpen(false)
            load()
        } catch (err) {
            console.error(err)
        }
    }

    async function handleDeleteTag(id: number) {
        try {
            await window.api.deleteTag(id)
            setDeleteConfirm(null)
            load()
        } catch (err) {
            console.error(err)
        }
    }

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
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Tags</h2>
                <button className="btn btn--primary" onClick={openAdd}>
                    <Plus size={16} />
                    Add Tag
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {tags.length === 0 ? (
                    <div className="card__empty" style={{ padding: 60 }}>No tags yet. Add tags to group transactions.</div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 20 }}>
                        {tags.map(tag => (
                            <div
                                key={tag.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    background: tag.color + '14',
                                    border: '1px solid ' + tag.color + '30',
                                }}
                            >
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: tag.color }} />
                                <span style={{ fontWeight: 600, color: tag.color }}>{tag.name}</span>
                                <button className="btn btn--ghost btn--icon" onClick={() => openEdit(tag)}><Edit3 size={12} /></button>
                                <button className="btn btn--ghost btn--icon" onClick={() => setDeleteConfirm(tag.id)}><Trash2 size={12} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">{editing ? 'Edit Tag' : 'Add Tag'}</h2>
                            <button className="modal__close" onClick={() => setModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="modal__body">
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input type="text" className="form-input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Tag name" />
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
                            <h2 className="modal__title">Delete tag?</h2>
                            <button className="modal__close" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
                        </div>
                        <div className="modal__body">
                            <p style={{ color: 'var(--color-text-secondary)' }}>This will remove the tag from all transactions.</p>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn btn--danger" onClick={() => handleDeleteTag(deleteConfirm)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Tags
