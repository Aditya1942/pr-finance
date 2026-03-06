import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit3, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import type { Transaction } from '../types'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(d: string): string {
    const date = new Date(d)
    return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}

function TransactionDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [tx, setTx] = useState<Transaction | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleteConfirm, setDeleteConfirm] = useState(false)

    useEffect(() => {
        if (id) load(parseInt(id))
    }, [id])

    async function load(txId: number) {
        setLoading(true)
        try {
            const data = await window.api.getTransaction(txId)
            setTx(data)
        } catch (err) {
            console.error(err)
            setTx(null)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!tx) return
        try {
            await window.api.deleteTransaction(tx.id)
            navigate('/transactions')
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) {
        return (
            <div className="page">
                <div className="card" style={{ minHeight: 200 }} />
            </div>
        )
    }

    if (!tx) {
        return (
            <div className="page">
                <button className="btn btn--ghost" onClick={() => navigate('/transactions')}>
                    <ArrowLeft size={16} />
                    Back to Transactions
                </button>
                <div className="card__empty">Transaction not found.</div>
            </div>
        )
    }

    return (
        <div className="page">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button className="btn btn--ghost btn--icon" onClick={() => navigate('/transactions')} title="Back">
                    <ArrowLeft size={18} />
                </button>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Transaction</h2>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button className="btn btn--ghost" onClick={() => navigate('/transactions')}>
                        <Edit3 size={14} />
                        Edit
                    </button>
                    <button className="btn btn--ghost" style={{ color: 'var(--color-accent-red)' }} onClick={() => setDeleteConfirm(true)}>
                        <Trash2 size={14} />
                        Delete
                    </button>
                </div>
            </div>

            <div className="card" style={{ maxWidth: 560 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: tx.category_color + '18',
                            color: tx.category_color,
                        }}
                    >
                        {tx.type === 'income' ? <ArrowUpRight size={28} /> : <ArrowDownRight size={28} />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                            {tx.description || tx.category_name}
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                            {formatDate(tx.date)} · {tx.category_name}
                        </div>
                    </div>
                    <div className={tx.type === 'income' ? 'text-income' : 'text-expense'} style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                    </div>
                </div>

                <dl style={{ display: 'grid', gap: 12, margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <dt style={{ margin: 0, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Date</dt>
                        <dd style={{ margin: 0, fontWeight: 600 }}>{formatDate(tx.date)}</dd>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <dt style={{ margin: 0, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Category</dt>
                        <dd style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: tx.category_color }} />
                            {tx.category_name}
                        </dd>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <dt style={{ margin: 0, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Type</dt>
                        <dd style={{ margin: 0, textTransform: 'capitalize', fontWeight: 600 }}>{tx.type}</dd>
                    </div>
                    {tx.tags && tx.tags.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                            <dt style={{ margin: 0, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Tags</dt>
                            <dd style={{ margin: 0, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {tx.tags.map(tag => (
                                    <span key={tag.id} className="tag" style={{ background: tag.color + '18', color: tag.color }}>
                                        {tag.name}
                                    </span>
                                ))}
                            </dd>
                        </div>
                    )}
                </dl>
            </div>

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(false)}>
                    <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Delete transaction?</h2>
                        </div>
                        <div className="modal__body">
                            <p style={{ color: 'var(--color-text-secondary)' }}>This cannot be undone.</p>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--ghost" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                            <button className="btn btn--danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TransactionDetail
