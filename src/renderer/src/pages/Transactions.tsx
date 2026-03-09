import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Plus, Search, X, Trash2, Edit3,
    ArrowUpRight, ArrowDownRight, Tag as TagIcon, Filter
} from 'lucide-react'
import { getCurrencySymbol } from '../constants/currencies'
import type { Transaction, Category, Tag, Account } from '../types'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(d: string): string {
    const date = new Date(d)
    return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}

function Transactions() {
    const navigate = useNavigate()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState<string>('')
    const [filterCategory, setFilterCategory] = useState<number | ''>('')
    const [filterTag, setFilterTag] = useState<number | ''>('')
    const [filterAccount, setFilterAccount] = useState<number | ''>('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    // Bulk
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [bulkRecatModal, setBulkRecatModal] = useState(false)
    const [bulkRecatCategory, setBulkRecatCategory] = useState<number | ''>('')

    // Modal
    const [showModal, setShowModal] = useState(false)
    const [editingTx, setEditingTx] = useState<Transaction | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

    // Form state
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
    const [formAmount, setFormAmount] = useState('')
    const [formDesc, setFormDesc] = useState('')
    const [formCategory, setFormCategory] = useState<number | ''>('')
    const [formType, setFormType] = useState<'income' | 'expense'>('expense')
    const [formTags, setFormTags] = useState<number[]>([])
    const [formAccount, setFormAccount] = useState<number | ''>('')
    const [defaultCurrency, setDefaultCurrency] = useState('USD')
    const [newTagName, setNewTagName] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        loadTransactions()
    }, [search, filterType, filterCategory, filterTag, filterAccount, dateFrom, dateTo])

    async function loadData() {
        try {
            const [cats, tgs, accs, currency] = await Promise.all([
                window.api.getCategories(),
                window.api.getTags(),
                window.api.getAccounts().catch(() => []),
                window.api.getDefaultCurrency().then(c => c || 'USD')
            ])
            setCategories(cats)
            setTags(tgs)
            setAccounts(accs)
            setDefaultCurrency(currency)
            await loadTransactions()
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function loadTransactions() {
        try {
            const filters: any = {}
            if (search) filters.search = search
            if (filterType) filters.type = filterType
            if (filterCategory) filters.categoryId = filterCategory
            if (filterTag) filters.tagId = filterTag
            if (filterAccount) filters.accountId = filterAccount
            if (dateFrom) filters.startDate = dateFrom
            if (dateTo) filters.endDate = dateTo
            const txs = await window.api.getTransactions(filters)
            setTransactions(txs)
        } catch (err) {
            console.error(err)
        }
    }

    function toggleSelect(id: number) {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function toggleSelectAll() {
        if (selectedIds.size === transactions.length) setSelectedIds(new Set())
        else setSelectedIds(new Set(transactions.map(t => t.id)))
    }

    async function bulkDelete() {
        if (selectedIds.size === 0) return
        try {
            await window.api.bulkDeleteTransactions([...selectedIds])
            setSelectedIds(new Set())
            loadTransactions()
        } catch (err) {
            console.error(err)
        }
    }

    async function bulkRecategorize() {
        if (selectedIds.size === 0 || !bulkRecatCategory) return
        try {
            await window.api.bulkUpdateTransactionCategory([...selectedIds], bulkRecatCategory)
            setSelectedIds(new Set())
            setBulkRecatModal(false)
            setBulkRecatCategory('')
            loadTransactions()
        } catch (err) {
            console.error(err)
        }
    }

    function openAddModal() {
        setEditingTx(null)
        setFormDate(new Date().toISOString().split('T')[0])
        setFormAmount('')
        setFormDesc('')
        setFormCategory('')
        setFormType('expense')
        setFormTags([])
        setFormAccount('')
        setShowModal(true)
    }

    function openEditModal(tx: Transaction) {
        setEditingTx(tx)
        setFormDate(tx.date)
        setFormAmount(String(tx.amount))
        setFormDesc(tx.description || '')
        setFormCategory(tx.category_id)
        setFormType(tx.type)
        setFormTags(tx.tags?.map(t => t.id) || [])
        setFormAccount(tx.account_id ?? '')
        setShowModal(true)
    }

    async function handleSave() {
        if (!formAmount || !formCategory || !formDate) return

        const data = {
            date: formDate,
            amount: parseFloat(formAmount),
            description: formDesc,
            category_id: formCategory as number,
            type: formType,
            tagIds: formTags,
            account_id: formAccount === '' ? null : (formAccount as number),
        }

        try {
            if (editingTx) {
                await window.api.updateTransaction(editingTx.id, data)
            } else {
                await window.api.createTransaction(data)
            }
            setShowModal(false)
            loadTransactions()
        } catch (err) {
            console.error(err)
        }
    }

    async function handleDelete(id: number) {
        try {
            await window.api.deleteTransaction(id)
            setDeleteConfirm(null)
            loadTransactions()
        } catch (err) {
            console.error(err)
        }
    }

    async function handleCreateTag() {
        if (!newTagName.trim()) return
        try {
            const colors = ['#6366f1', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#06b6d4']
            const color = colors[tags.length % colors.length]
            const tag = await window.api.createTag({ name: newTagName.trim(), color })
            setTags([...tags, tag])
            setFormTags([...formTags, tag.id])
            setNewTagName('')
        } catch (err) {
            console.error(err)
        }
    }

    function toggleTag(id: number) {
        setFormTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
    }

    const filteredCategories = categories.filter(c => c.type === formType)

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const netTotal = totalIncome - totalExpense

    if (loading) {
        return (
            <div className="page">
                <div className="card" style={{ minHeight: 300 }} />
            </div>
        )
    }

    return (
        <div className="page">
            {/* Toolbar */}
            <div className="toolbar">
                <button className="btn btn--primary" onClick={openAddModal}>
                    <Plus size={16} />
                    Add Transaction
                </button>

                <div className="toolbar__spacer" />

                {/* Filters */}
                <select
                    className="form-select"
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    style={{ padding: '8px 36px 8px 12px', fontSize: 13 }}
                >
                    <option value="">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>

                <select
                    className="form-select"
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value ? parseInt(e.target.value) : '')}
                    style={{ padding: '8px 36px 8px 12px', fontSize: 13 }}
                >
                    <option value="">All Categories</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>

                {tags.length > 0 && (
                    <select
                        className="form-select"
                        value={filterTag}
                        onChange={e => setFilterTag(e.target.value ? parseInt(e.target.value) : '')}
                        style={{ padding: '8px 36px 8px 12px', fontSize: 13 }}
                    >
                        <option value="">All Tags</option>
                        {tags.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                )}

                {accounts.length > 0 && (
                    <select
                        className="form-select"
                        value={filterAccount}
                        onChange={e => setFilterAccount(e.target.value ? parseInt(e.target.value) : '')}
                        style={{ padding: '8px 36px 8px 12px', fontSize: 13 }}
                    >
                        <option value="">All Accounts</option>
                        {accounts.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                        type="date"
                        className="form-input"
                        placeholder="From"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        style={{ padding: '8px 10px', fontSize: 13, minWidth: 130 }}
                        title="From date"
                    />
                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>→</span>
                    <input
                        type="date"
                        className="form-input"
                        placeholder="To"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        style={{ padding: '8px 10px', fontSize: 13, minWidth: 130 }}
                        title="To date"
                    />
                    {(dateFrom || dateTo) && (
                        <button
                            type="button"
                            className="btn btn--ghost btn--icon"
                            onClick={() => { setDateFrom(''); setDateTo('') }}
                            title="Clear date range"
                            aria-label="Clear date range"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="toolbar__search">
                    <Search size={14} className="toolbar__search-icon" />
                    <input
                        type="text"
                        className="toolbar__search-input"
                        placeholder="Search transactions..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Bulk actions bar */}
            {selectedIds.size > 0 && (
                <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>{selectedIds.size} selected</span>
                    <button className="btn btn--ghost" onClick={() => setBulkRecatModal(true)}>Re-categorize</button>
                    <button className="btn btn--ghost" style={{ color: 'var(--color-accent-red)' }} onClick={bulkDelete}>Delete</button>
                    <button className="btn btn--ghost" onClick={() => setSelectedIds(new Set())}>Clear</button>
                </div>
            )}

            {/* Transaction Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {transactions.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 44 }}>
                                    <input type="checkbox" checked={transactions.length > 0 && selectedIds.size === transactions.length} onChange={toggleSelectAll} title="Select all" />
                                </th>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Tags</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th style={{ width: 80 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(tx => (
                                <tr key={tx.id}>
                                    <td>
                                        <input type="checkbox" checked={selectedIds.has(tx.id)} onChange={() => toggleSelect(tx.id)} />
                                    </td>
                                    <td>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                                            {formatDate(tx.date)}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 30,
                                                    height: 30,
                                                    borderRadius: 8,
                                                    background: tx.category_color + '18',
                                                    color: tx.category_color,
                                                    flexShrink: 0
                                                }}
                                            >
                                                {tx.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                            </span>
                                            <button type="button" className="btn btn--ghost" style={{ padding: 0, fontWeight: 600, textAlign: 'left' }} onClick={() => navigate(`/transactions/${tx.id}`)}>
                                                {tx.description || '—'}
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                fontSize: 13,
                                                color: 'var(--color-text-secondary)'
                                            }}
                                        >
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: tx.category_color }} />
                                            {tx.category_name}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                            {tx.tags?.map(tag => (
                                                <span
                                                    key={tag.id}
                                                    className="tag tag--small"
                                                    style={{
                                                        background: tag.color + '18',
                                                        color: tag.color,
                                                    }}
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span
                                            className={`text-mono font-bold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}
                                            style={{ fontSize: 14 }}
                                        >
                                            {tx.type === 'income' ? '+' : '-'}{getCurrencySymbol(defaultCurrency)} {Number(tx.amount).toLocaleString()}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                            <button className="btn btn--ghost btn--icon" onClick={() => openEditModal(tx)} title="Edit">
                                                <Edit3 size={14} />
                                            </button>
                                            <button className="btn btn--ghost btn--icon" onClick={() => setDeleteConfirm(tx.id)} title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: 'var(--color-bg-subtle)' }}>
                                <td colSpan={5} style={{ padding: '12px 16px', fontWeight: 600, borderTop: '2px solid var(--color-border)' }}>
                                    Total
                                </td>
                                <td style={{ textAlign: 'right', padding: '12px 16px', borderTop: '2px solid var(--color-border)' }}>
                                    <span
                                        className={`text-mono font-bold ${netTotal >= 0 ? 'text-income' : 'text-expense'}`}
                                        style={{ fontSize: 14 }}
                                    >
                                        {netTotal >= 0 ? '+' : ''}{getCurrencySymbol(defaultCurrency)} {netTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </span>
                                </td>
                                <td style={{ width: 80, borderTop: '2px solid var(--color-border)' }} />
                            </tr>
                        </tfoot>
                    </table>
                ) : (
                    <div className="card__empty" style={{ padding: 60 }}>
                        <div style={{ marginBottom: 8, fontSize: 32 }}>📊</div>
                        No transactions found. Click "Add Transaction" to get started.
                    </div>
                )}
            </div>

            {/* Bulk re-categorize modal */}
            {bulkRecatModal && (
                <div className="modal-overlay" onClick={() => setBulkRecatModal(false)}>
                    <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Re-categorize {selectedIds.size} transactions</h2>
                            <button className="modal__close" onClick={() => setBulkRecatModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal__body">
                            <div className="form-group">
                                <label className="form-label">New category</label>
                                <select className="form-select" value={bulkRecatCategory === '' ? '' : String(bulkRecatCategory)} onChange={e => setBulkRecatCategory(e.target.value ? parseInt(e.target.value) : '')}>
                                    <option value="">Select category</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--ghost" onClick={() => setBulkRecatModal(false)}>Cancel</button>
                            <button className="btn btn--primary" onClick={bulkRecategorize} disabled={!bulkRecatCategory}>Update</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add/Edit Modal ── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">{editingTx ? 'Edit Transaction' : 'Add Transaction'}</h2>
                            <button className="modal__close" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal__body">
                            {/* Type Toggle */}
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <div className="type-toggle">
                                    <button
                                        className={`type-toggle__btn ${formType === 'income' ? 'type-toggle__btn--active-income' : ''}`}
                                        onClick={() => { setFormType('income'); setFormCategory('') }}
                                    >
                                        Income
                                    </button>
                                    <button
                                        className={`type-toggle__btn ${formType === 'expense' ? 'type-toggle__btn--active-expense' : ''}`}
                                        onClick={() => { setFormType('expense'); setFormCategory('') }}
                                    >
                                        Expense
                                    </button>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formDate}
                                        onChange={e => setFormDate(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Amount</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        value={formAmount}
                                        onChange={e => setFormAmount(e.target.value)}
                                        style={{ fontFamily: 'var(--font-mono)' }}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="What was this for?"
                                    value={formDesc}
                                    onChange={e => setFormDesc(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select
                                    className="form-select"
                                    value={formCategory}
                                    onChange={e => setFormCategory(parseInt(e.target.value))}
                                >
                                    <option value="">Select category...</option>
                                    {filteredCategories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {accounts.length > 0 && (
                                <div className="form-group">
                                    <label className="form-label">Account (optional)</label>
                                    <select
                                        className="form-select"
                                        value={formAccount === '' ? '' : String(formAccount)}
                                        onChange={e => setFormAccount(e.target.value ? parseInt(e.target.value) : '')}
                                    >
                                        <option value="">None</option>
                                        {accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Tags */}
                            <div className="form-group">
                                <label className="form-label">
                                    <TagIcon size={12} style={{ display: 'inline', marginRight: 4 }} />
                                    Tags (click to add, × to remove)
                                </label>
                                <div className="tag-select">
                                    {tags.map(tag => {
                                        const selected = formTags.includes(tag.id)
                                        return (
                                            <span
                                                key={tag.id}
                                                className={`tag-select__tag ${selected ? 'tag-select__tag--selected' : ''}`}
                                                style={{
                                                    background: selected ? tag.color + '20' : 'transparent',
                                                    color: tag.color,
                                                    borderColor: selected ? tag.color : 'var(--color-border)',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                }}
                                                onClick={() => !selected && toggleTag(tag.id)}
                                            >
                                                <span>{tag.name}</span>
                                                {selected && (
                                                    <button
                                                        type="button"
                                                        className="btn btn--ghost btn--icon"
                                                        style={{ padding: 2, minWidth: 20, minHeight: 20, color: tag.color }}
                                                        onClick={e => { e.stopPropagation(); toggleTag(tag.id) }}
                                                        title="Remove tag"
                                                        aria-label={`Remove ${tag.name}`}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </span>
                                        )
                                    })}
                                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            value={newTagName}
                                            onChange={e => setNewTagName(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleCreateTag()}
                                            placeholder="+ New tag"
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                outline: 'none',
                                                fontSize: 12,
                                                color: 'var(--color-text-secondary)',
                                                fontFamily: 'var(--font-display)',
                                                width: 80,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleSave}>
                                {editingTx ? 'Update' : 'Add Transaction'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteConfirm !== null && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
                        <div className="modal__body">
                            <div className="confirm-dialog">
                                <div className="confirm-dialog__icon">
                                    <Trash2 size={24} />
                                </div>
                                <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>Delete Transaction</h3>
                                <p className="confirm-dialog__text">
                                    Are you sure? This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="modal__footer" style={{ justifyContent: 'center' }}>
                            <button className="btn btn--secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn btn--danger" onClick={() => handleDelete(deleteConfirm)}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Transactions
