import { useState, useEffect } from 'react'
import { Plus, Wallet, Building2, PiggyBank, TrendingUp, CreditCard, Users, ArrowLeftRight, X, Edit3, Trash2 } from 'lucide-react'
import { getCurrencySymbol } from '../constants/currencies'
import type { Account, AccountBalance } from '../types'

const ACCOUNT_TYPES = [
    { value: 'cash', label: 'Cash', icon: Wallet },
    { value: 'bank', label: 'Bank', icon: Building2 },
    { value: 'saving', label: 'Saving', icon: PiggyBank },
    { value: 'investment', label: 'Investment', icon: TrendingUp },
    { value: 'loan', label: 'Loan', icon: CreditCard },
    { value: 'account_payable', label: 'Account Payable', icon: Users },
    { value: 'account_receivable', label: 'Account Receivable', icon: ArrowLeftRight },
    { value: 'capital', label: 'Capital', icon: Wallet },
] as const

function Accounts() {
    const [defaultCurrency, setDefaultCurrency] = useState('USD')
    const [balances, setBalances] = useState<AccountBalance[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Account | null>(null)
    const [formName, setFormName] = useState('')
    const [formType, setFormType] = useState<string>('bank')
    const [formInitial, setFormInitial] = useState('0')
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

    const [transferOpen, setTransferOpen] = useState(false)
    const [transferFrom, setTransferFrom] = useState<number | ''>('')
    const [transferTo, setTransferTo] = useState<number | ''>('')
    const [transferAmount, setTransferAmount] = useState('')
    const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10))
    const [transferMemo, setTransferMemo] = useState('')
    const [transferSubmitting, setTransferSubmitting] = useState(false)
    const [transferError, setTransferError] = useState<string | null>(null)

    useEffect(() => {
        load()
    }, [])

    async function load() {
        setLoading(true)
        try {
            const [data, currency] = await Promise.all([
                window.api.getAccountBalances(),
                window.api.getDefaultCurrency().then(c => c || 'USD'),
            ])
            setBalances(data)
            setDefaultCurrency(currency)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    function openAdd() {
        setEditing(null)
        setFormName('')
        setFormType('bank')
        setFormInitial('0')
        setModalOpen(true)
    }

    function openEdit(acc: Account) {
        setEditing(acc)
        setFormName(acc.name)
        setFormType(acc.type)
        setFormInitial(String(acc.initial_balance ?? 0))
        setModalOpen(true)
    }

    async function handleSave() {
        const initial = parseFloat(formInitial) || 0
        if (!formName.trim()) return
        try {
            if (editing) {
                await window.api.updateAccount(editing.id, { name: formName.trim(), type: formType, initial_balance: initial })
            } else {
                await window.api.createAccount({ name: formName.trim(), type: formType, initial_balance: initial })
            }
            setModalOpen(false)
            load()
        } catch (err) {
            console.error(err)
        }
    }

    async function handleDelete(id: number) {
        try {
            await window.api.deleteAccount(id)
            setDeleteConfirm(null)
            load()
        } catch (err) {
            console.error(err)
        }
    }

    function openTransfer() {
        setTransferFrom('')
        setTransferTo('')
        setTransferAmount('')
        setTransferDate(new Date().toISOString().slice(0, 10))
        setTransferMemo('')
        setTransferError(null)
        setTransferOpen(true)
    }

    async function handleTransfer() {
        const fromId = typeof transferFrom === 'number' ? transferFrom : null
        const toId = typeof transferTo === 'number' ? transferTo : null
        const amount = parseFloat(transferAmount)
        if (fromId == null || toId == null || !Number.isFinite(amount) || amount <= 0) {
            setTransferError('Select both accounts and enter a valid amount.')
            return
        }
        if (fromId === toId) {
            setTransferError('Source and destination must be different.')
            return
        }
        setTransferSubmitting(true)
        setTransferError(null)
        try {
            await window.api.transfer({
                from_account_id: fromId,
                to_account_id: toId,
                amount,
                date: transferDate,
                memo: transferMemo.trim() || undefined,
            })
            setTransferOpen(false)
            load()
        } catch (err) {
            setTransferError(err instanceof Error ? err.message : 'Transfer failed')
        } finally {
            setTransferSubmitting(false)
        }
    }

    const totalBalance = balances.reduce((s, a) => s + a.balance, 0)
    const assetTypes = ['cash', 'bank', 'saving', 'investment', 'account_receivable']
    const bankAndCash = balances.filter(a => ['cash', 'bank', 'saving'].includes(a.type))

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
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Accounts</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        className="btn btn--secondary"
                        onClick={openTransfer}
                        disabled={balances.length < 2}
                        title={balances.length < 2 ? 'Add at least two accounts to transfer' : 'Transfer between accounts'}
                    >
                        <ArrowLeftRight size={16} />
                        Transfer
                    </button>
                    <button className="btn btn--primary" onClick={openAdd}>
                        <Plus size={16} />
                        Add Account
                    </button>
                </div>
            </div>

            {/* Bank & cash snapshot (Legacy) */}
            {bankAndCash.length > 0 && (
                <div className="card">
                    <h3 className="chart-card__title" style={{ marginBottom: 16 }}>Bank & Cash Snapshot</h3>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th style={{ textAlign: 'right' }}>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bankAndCash.map(a => (
                                <tr key={a.id}>
                                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                        {getCurrencySymbol(defaultCurrency)}{Number(a.balance).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                            <tr style={{ borderTop: '2px solid var(--color-border)', fontWeight: 700 }}>
                                <td>Total</td>
                                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                    {getCurrencySymbol(defaultCurrency)}{Number(bankAndCash.reduce((s, a) => s + a.balance, 0)).toLocaleString('en-IN')}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* All accounts by type */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {balances.length === 0 ? (
                    <div className="card__empty" style={{ padding: 60 }}>
                        No accounts yet. Add your first account to track balances.
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th style={{ textAlign: 'right' }}>Balance</th>
                                <th style={{ width: 100 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {balances.map(acc => {
                                const typeInfo = ACCOUNT_TYPES.find(t => t.value === acc.type)
                                const Icon = typeInfo?.icon ?? Wallet
                                return (
                                    <tr key={acc.id}>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' }}>
                                                    <Icon size={18} />
                                                </span>
                                                <span style={{ fontWeight: 600 }}>{acc.name}</span>
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ textTransform: 'capitalize', color: 'var(--color-text-secondary)' }}>
                                                {typeInfo?.label ?? acc.type}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                            {getCurrencySymbol(defaultCurrency)}{Number(acc.balance).toLocaleString('en-IN')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                                <button className="btn btn--ghost btn--icon" onClick={() => openEdit(acc)} title="Edit">
                                                    <Edit3 size={14} />
                                                </button>
                                                <button className="btn btn--ghost btn--icon" onClick={() => setDeleteConfirm(acc.id)} title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">{editing ? 'Edit Account' : 'Add Account'}</h2>
                            <button className="modal__close" onClick={() => setModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="modal__body">
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input type="text" className="form-input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Lloyd's, Cash" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="form-select" value={formType} onChange={e => setFormType(e.target.value)}>
                                    {ACCOUNT_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Initial balance ({getCurrencySymbol(defaultCurrency)})</label>
                                <input type="number" className="form-input" value={formInitial} onChange={e => setFormInitial(e.target.value)} step="0.01" />
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleSave}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {transferOpen && (
                <div className="modal-overlay" onClick={() => !transferSubmitting && setTransferOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Transfer between accounts</h2>
                            <button className="modal__close" onClick={() => !transferSubmitting && setTransferOpen(false)} disabled={transferSubmitting}><X size={18} /></button>
                        </div>
                        <div className="modal__body">
                            {transferError && (
                                <p style={{ color: 'var(--color-danger, #ef4444)', marginBottom: 12, fontSize: 14 }}>{transferError}</p>
                            )}
                            <div className="form-group">
                                <label className="form-label">From</label>
                                <select
                                    className="form-select"
                                    value={transferFrom === '' ? '' : String(transferFrom)}
                                    onChange={e => setTransferFrom(e.target.value === '' ? '' : Number(e.target.value))}
                                >
                                    <option value="">Select account</option>
                                    {balances.map(a => (
                                        <option key={a.id} value={a.id}>{a.name} ({getCurrencySymbol(defaultCurrency)}{Number(a.balance).toLocaleString('en-IN')})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">To</label>
                                <select
                                    className="form-select"
                                    value={transferTo === '' ? '' : String(transferTo)}
                                    onChange={e => setTransferTo(e.target.value === '' ? '' : Number(e.target.value))}
                                >
                                    <option value="">Select account</option>
                                    {balances.map(a => (
                                        <option key={a.id} value={a.id}>{a.name} ({getCurrencySymbol(defaultCurrency)}{Number(a.balance).toLocaleString('en-IN')})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Amount ({getCurrencySymbol(defaultCurrency)})</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={transferAmount}
                                    onChange={e => setTransferAmount(e.target.value)}
                                    step="0.01"
                                    min="0.01"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={transferDate}
                                    onChange={e => setTransferDate(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Memo (optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={transferMemo}
                                    onChange={e => setTransferMemo(e.target.value)}
                                    placeholder="e.g. Monthly savings transfer"
                                />
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--ghost" onClick={() => setTransferOpen(false)} disabled={transferSubmitting}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleTransfer} disabled={transferSubmitting}>
                                {transferSubmitting ? 'Transferring…' : 'Transfer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm !== null && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Delete account?</h2>
                            <button className="modal__close" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
                        </div>
                        <div className="modal__body">
                            <p style={{ color: 'var(--color-text-secondary)' }}>Transactions linked to this account will be unlinked. This cannot be undone.</p>
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

export default Accounts
