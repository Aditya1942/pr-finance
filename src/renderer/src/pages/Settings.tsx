import { useState, useEffect, useRef, useMemo } from 'react'
import { Save, Download, Database, Trash2, HardDrive, FileSpreadsheet, AlertTriangle, CheckCircle, Settings2, Table2, Shield, Search, X, ChevronDown, Check, Upload, FileUp } from 'lucide-react'
import { CURRENCY_CODES, getCurrencySymbol } from '../constants/currencies'

type Tab = 'general' | 'database'

interface DbStats {
    fileSize: number
    tables: { name: string; count: number }[]
    path: string
}

function Settings() {
    const [activeTab, setActiveTab] = useState<Tab>('general')
    const [userDataPath, setUserDataPath] = useState('')
    const [defaultCurrency, setDefaultCurrency] = useState('USD')
    const [saved, setSaved] = useState(false)
    const [dbStats, setDbStats] = useState<DbStats | null>(null)
    const [loading, setLoading] = useState<string | null>(null)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
    const [clearStep, setClearStep] = useState<0 | 1 | 2>(0)
    const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false)
    const [currencySearch, setCurrencySearch] = useState('')
    const currencySearchRef = useRef<HTMLInputElement>(null)

    const filteredCurrencies = useMemo(() => {
        if (!currencySearch.trim()) return CURRENCY_CODES
        const q = currencySearch.trim().toUpperCase()
        return CURRENCY_CODES.filter(code => code.includes(q))
    }, [currencySearch])

    useEffect(() => {
        if (currencyPickerOpen && currencySearchRef.current) {
            setTimeout(() => currencySearchRef.current?.focus(), 50)
        }
        if (!currencyPickerOpen) {
            setCurrencySearch('')
        }
    }, [currencyPickerOpen])

    useEffect(() => {
        load()
    }, [])

    useEffect(() => {
        if (activeTab === 'database' && !dbStats) {
            loadDbStats()
        }
    }, [activeTab])

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3500)
            return () => clearTimeout(t)
        }
    }, [toast])

    async function load() {
        try {
            const path = await window.api.getUserDataPath()
            setUserDataPath(path)
            const currency = await window.api.getDefaultCurrency()
            if (currency) setDefaultCurrency(currency)
        } catch (err) {
            console.error(err)
        }
    }

    async function loadDbStats() {
        try {
            const stats = await window.api.getDatabaseStats()
            setDbStats(stats)
        } catch (err) {
            console.error(err)
        }
    }

    async function saveDefaultCurrency() {
        try {
            await window.api.setDefaultCurrency(defaultCurrency)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            console.error(err)
        }
    }

    async function exportCsv() {
        try {
            setLoading('csv')
            const csv = await window.api.exportTransactionsToCsv()
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
            a.click()
            URL.revokeObjectURL(url)
            setToast({ message: 'CSV exported successfully', type: 'success' })
        } catch (err) {
            console.error(err)
            setToast({ message: 'Failed to export CSV', type: 'error' })
        } finally {
            setLoading(null)
        }
    }

    async function handleBackup() {
        try {
            setLoading('backup')
            const result = await window.api.backupDatabase()
            if (result.canceled) {
                setToast({ message: 'Backup cancelled', type: 'info' })
            } else if (result.success) {
                setToast({ message: 'Database backed up successfully!', type: 'success' })
            }
        } catch (err) {
            console.error(err)
            setToast({ message: 'Failed to backup database', type: 'error' })
        } finally {
            setLoading(null)
        }
    }

    async function handleExportExcel() {
        try {
            setLoading('excel')
            const result = await window.api.exportToExcel()
            if (result.canceled) {
                setToast({ message: 'Export cancelled', type: 'info' })
            } else if (result.success) {
                setToast({ message: 'Exported to Excel successfully! Includes 6 tabs.', type: 'success' })
            }
        } catch (err) {
            console.error(err)
            setToast({ message: 'Failed to export to Excel', type: 'error' })
        } finally {
            setLoading(null)
        }
    }

    async function handleClearDatabase() {
        if (clearStep < 2) {
            setClearStep((clearStep + 1) as 1 | 2)
            return
        }
        try {
            setLoading('clear')
            await window.api.clearDatabase()
            setToast({ message: 'Database cleared. Default categories have been re-seeded.', type: 'success' })
            setClearStep(0)
            loadDbStats()
        } catch (err) {
            console.error(err)
            setToast({ message: 'Failed to clear database', type: 'error' })
        } finally {
            setLoading(null)
        }
    }

    async function handleImportCsv() {
        try {
            setLoading('importCsv')
            const result = await window.api.importCsv()
            if (result.canceled) {
                setToast({ message: 'Import cancelled', type: 'info' })
            } else if (result.success) {
                const msg = `Imported ${result.imported} transaction${result.imported !== 1 ? 's' : ''}${result.skipped ? ` (${result.skipped} skipped)` : ''}`
                setToast({ message: msg, type: 'success' })
                loadDbStats()
            } else {
                setToast({ message: result.error || 'Import failed', type: 'error' })
            }
        } catch (err) {
            console.error(err)
            setToast({ message: 'Failed to import CSV', type: 'error' })
        } finally {
            setLoading(null)
        }
    }

    async function handleRestoreDatabase() {
        try {
            setLoading('restore')
            const result = await window.api.restoreDatabase()
            if (result.canceled) {
                setToast({ message: 'Restore cancelled', type: 'info' })
            } else if (result.success) {
                setToast({ message: 'Database restored successfully! Reload to see changes.', type: 'success' })
                loadDbStats()
            } else {
                setToast({ message: result.error || 'Restore failed', type: 'error' })
            }
        } catch (err) {
            console.error(err)
            setToast({ message: 'Failed to restore database', type: 'error' })
        } finally {
            setLoading(null)
        }
    }

    function formatFileSize(bytes: number) {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'general', label: 'General', icon: <Settings2 size={16} /> },
        { key: 'database', label: 'Database', icon: <Database size={16} /> },
    ]

    return (
        <div className="page">
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Settings</h2>

            {/* Tab Bar */}
            <div style={{
                display: 'flex',
                gap: 4,
                background: 'var(--color-bg-secondary)',
                borderRadius: 12,
                padding: 4,
                marginBottom: 20,
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setClearStep(0) }}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            padding: '10px 16px',
                            borderRadius: 10,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            background: activeTab === tab.key
                                ? 'var(--color-bg-tertiary)'
                                : 'transparent',
                            color: activeTab === tab.key
                                ? 'var(--color-text-primary)'
                                : 'var(--color-text-muted)',
                            boxShadow: activeTab === tab.key
                                ? '0 1px 3px rgba(0,0,0,0.2)'
                                : 'none',
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: 56,
                    right: 24,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 20px',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 500,
                    animation: 'fadeInDown 0.3s ease',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    background: toast.type === 'success'
                        ? 'linear-gradient(135deg, #059669, #10b981)'
                        : toast.type === 'error'
                            ? 'linear-gradient(135deg, #dc2626, #ef4444)'
                            : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                    color: '#fff',
                }}>
                    {toast.type === 'success' && <CheckCircle size={16} />}
                    {toast.type === 'error' && <AlertTriangle size={16} />}
                    {toast.message}
                </div>
            )}

            {/* Currency Picker Dialog */}
            {currencyPickerOpen && (
                <div
                    className="modal-overlay"
                    onClick={(e) => { if (e.target === e.currentTarget) setCurrencyPickerOpen(false) }}
                    style={{ zIndex: 200 }}
                >
                    <div className="currency-picker">
                        <div className="currency-picker__header">
                            <h3 className="currency-picker__title">Select Currency</h3>
                            <button
                                className="modal__close"
                                onClick={() => setCurrencyPickerOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="currency-picker__search-wrap">
                            <Search size={15} className="currency-picker__search-icon" />
                            <input
                                ref={currencySearchRef}
                                className="currency-picker__search"
                                type="text"
                                placeholder="Search currencies…"
                                value={currencySearch}
                                onChange={e => setCurrencySearch(e.target.value)}
                            />
                            {currencySearch && (
                                <button
                                    className="currency-picker__search-clear"
                                    onClick={() => { setCurrencySearch(''); currencySearchRef.current?.focus() }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <div className="currency-picker__list">
                            {filteredCurrencies.length === 0 && (
                                <div className="currency-picker__empty">
                                    No currencies match "{currencySearch}"
                                </div>
                            )}
                            {filteredCurrencies.map(code => (
                                <button
                                    key={code}
                                    className={`currency-picker__item ${code === defaultCurrency ? 'currency-picker__item--selected' : ''}`}
                                    onClick={() => {
                                        setDefaultCurrency(code)
                                        setCurrencyPickerOpen(false)
                                    }}
                                >
                                    <span className="currency-picker__code">{code} {getCurrencySymbol(code)}</span>
                                    {code === defaultCurrency && (
                                        <Check size={16} className="currency-picker__check" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
                <>
                    <div className="card">
                        <h3 className="chart-card__title" style={{ marginBottom: 16 }}>Default currency</h3>
                        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                            All amounts are stored and displayed in this currency.
                        </p>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <button
                                className="currency-trigger"
                                onClick={() => setCurrencyPickerOpen(true)}
                            >
                                <span className="currency-trigger__code">{getCurrencySymbol(defaultCurrency)} ({defaultCurrency})</span>
                                <ChevronDown size={16} className="currency-trigger__chevron" />
                            </button>
                            <button className="btn btn--primary" onClick={saveDefaultCurrency}>
                                <Save size={14} />
                                {saved ? 'Saved' : 'Save'}
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="chart-card__title" style={{ marginBottom: 8 }}>Preferences</h3>
                        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                            Date format and other display options can be added here. Amounts use the currency set above.
                        </p>
                    </div>
                </>
            )}

            {/* Database Tab */}
            {activeTab === 'database' && (
                <>
                    {/* Database Stats Overview */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <HardDrive size={18} color="#fff" />
                            </div>
                            <div>
                                <h3 className="chart-card__title" style={{ margin: 0 }}>Database Overview</h3>
                                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                                    {dbStats ? formatFileSize(dbStats.fileSize) : '...'} &middot; SQLite
                                </p>
                            </div>
                        </div>

                        <code style={{
                            display: 'block', padding: 10,
                            background: 'var(--color-bg-tertiary)', borderRadius: 8,
                            fontSize: 12, wordBreak: 'break-all', marginBottom: 16,
                            color: 'var(--color-text-secondary)',
                        }}>
                            {dbStats?.path || `${userDataPath}/finance.db`}
                        </code>

                        {dbStats && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                gap: 8,
                            }}>
                                {dbStats.tables.map(t => (
                                    <div key={t.name} style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '8px 12px',
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: 8,
                                    }}>
                                        <Table2 size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {t.name}
                                            </div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                                {t.count.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Backup & Export */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'linear-gradient(135deg, #22c55e, #10b981)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Shield size={18} color="#fff" />
                            </div>
                            <div>
                                <h3 className="chart-card__title" style={{ margin: 0 }}>Backup & Export</h3>
                                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                                    Save your data in different formats
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {/* Backup DB */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 16px',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 10,
                                flexWrap: 'wrap', gap: 12,
                            }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                        Backup Database
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                        Save a full copy of your SQLite database file (.db)
                                    </div>
                                </div>
                                <button
                                    className="btn btn--ghost"
                                    onClick={handleBackup}
                                    disabled={loading === 'backup'}
                                    style={{ flexShrink: 0 }}
                                >
                                    <HardDrive size={14} />
                                    {loading === 'backup' ? 'Saving...' : 'Backup'}
                                </button>
                            </div>

                            {/* Export Excel */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 16px',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 10,
                                flexWrap: 'wrap', gap: 12,
                            }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                        Export as Excel
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                        Multi-tab workbook: Transactions, Categories, Accounts, Tags, Recurring, Reminders
                                    </div>
                                </div>
                                <button
                                    className="btn btn--ghost"
                                    onClick={handleExportExcel}
                                    disabled={loading === 'excel'}
                                    style={{ flexShrink: 0 }}
                                >
                                    <FileSpreadsheet size={14} />
                                    {loading === 'excel' ? 'Exporting...' : 'Export .xlsx'}
                                </button>
                            </div>

                            {/* Export CSV */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 16px',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 10,
                                flexWrap: 'wrap', gap: 12,
                            }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                        Export Transactions CSV
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                        Transactions only, simple CSV format
                                    </div>
                                </div>
                                <button
                                    className="btn btn--ghost"
                                    onClick={exportCsv}
                                    disabled={loading === 'csv'}
                                    style={{ flexShrink: 0 }}
                                >
                                    <Download size={14} />
                                    {loading === 'csv' ? 'Exporting...' : 'Export .csv'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Import */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Upload size={18} color="#fff" />
                            </div>
                            <div>
                                <h3 className="chart-card__title" style={{ margin: 0 }}>Import</h3>
                                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                                    Bring data into your database
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {/* Import CSV */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 16px',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 10,
                                flexWrap: 'wrap', gap: 12,
                            }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                        Import Transactions from CSV
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                        CSV with columns: Date, Amount, Description, Type, Category, Account, Tags
                                    </div>
                                </div>
                                <button
                                    className="btn btn--ghost"
                                    onClick={handleImportCsv}
                                    disabled={loading === 'importCsv'}
                                    style={{ flexShrink: 0 }}
                                >
                                    <FileUp size={14} />
                                    {loading === 'importCsv' ? 'Importing...' : 'Import .csv'}
                                </button>
                            </div>

                            {/* Restore Database */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 16px',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 10,
                                flexWrap: 'wrap', gap: 12,
                            }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                        Restore from Backup
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                        Replace current database with a .db backup file
                                    </div>
                                </div>
                                <button
                                    className="btn btn--ghost"
                                    onClick={handleRestoreDatabase}
                                    disabled={loading === 'restore'}
                                    style={{ flexShrink: 0 }}
                                >
                                    <HardDrive size={14} />
                                    {loading === 'restore' ? 'Restoring...' : 'Restore .db'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone: Clear Database */}
                    <div className="card" style={{
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Trash2 size={18} color="#fff" />
                            </div>
                            <div>
                                <h3 className="chart-card__title" style={{ margin: 0, color: '#ef4444' }}>Danger Zone</h3>
                                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                                    Irreversible actions — proceed with caution
                                </p>
                            </div>
                        </div>

                        <div style={{
                            padding: '14px 16px',
                            background: 'rgba(239, 68, 68, 0.06)',
                            borderRadius: 10,
                            border: '1px solid rgba(239, 68, 68, 0.12)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                        Clear Database
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, maxWidth: 380 }}>
                                        Permanently delete all transactions, accounts, tags, recurring templates, reminders, and preferences.
                                        Default categories will be re-created.
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                    {clearStep === 0 && (
                                        <button
                                            className="btn"
                                            onClick={handleClearDatabase}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                                color: '#ef4444',
                                                fontWeight: 600,
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Trash2 size={14} />
                                            Clear All Data
                                        </button>
                                    )}
                                    {clearStep === 1 && (
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 500 }}>
                                                <AlertTriangle size={13} style={{ verticalAlign: -2 }} /> Are you sure?
                                            </span>
                                            <button
                                                className="btn"
                                                onClick={handleClearDatabase}
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.15)',
                                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                                    color: '#ef4444',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Yes, continue
                                            </button>
                                            <button
                                                className="btn btn--ghost"
                                                onClick={() => setClearStep(0)}
                                                style={{ fontSize: 13 }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                    {clearStep === 2 && (
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                                                <AlertTriangle size={13} style={{ verticalAlign: -2 }} /> This CANNOT be undone!
                                            </span>
                                            <button
                                                className="btn"
                                                onClick={handleClearDatabase}
                                                disabled={loading === 'clear'}
                                                style={{
                                                    background: '#ef4444',
                                                    border: 'none',
                                                    color: '#fff',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                <Trash2 size={14} />
                                                {loading === 'clear' ? 'Clearing...' : 'DELETE EVERYTHING'}
                                            </button>
                                            <button
                                                className="btn btn--ghost"
                                                onClick={() => setClearStep(0)}
                                                style={{ fontSize: 13 }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default Settings
