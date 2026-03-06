import { useState, useEffect } from 'react'
import { Plus, Wallet, Building2, PiggyBank, TrendingUp, CreditCard, Users, ArrowLeftRight, X, Edit3, Trash2 } from 'lucide-react'
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
    const [balances, setBalances] = useState<AccountBalance[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Account | null>(null)
    const [formName, setFormName] = useState('')
    const [formType, setFormType] = useState<string>('bank')
    const [formInitial, setFormInitial] = useState('0')
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

    useEffect(() => {
        load()
    }, [])

    async function load() {
        setLoading(true)
        try {
            const data = await window.api.getAccountBalances()
            setBalances(data)
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
                <button className="btn btn--primary" onClick={openAdd}>
                    <Plus size={16} />
                    Add Account
                </button>
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
                                        ₹{Number(a.balance).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                            <tr style={{ borderTop: '2px solid var(--color-border)', fontWeight: 700 }}>
                                <td>Total</td>
                                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                    ₹{Number(bankAndCash.reduce((s, a) => s + a.balance, 0)).toLocaleString('en-IN')}
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
                                            ₹{Number(acc.balance).toLocaleString('en-IN')}
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
                                <label className="form-label">Initial balance (₹)</label>
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
