import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import * as XLSX from 'xlsx'

let db: InstanceType<typeof Database>

function initDatabase() {
  db = new Database(path.join(app.getPath('userData'), 'finance.db'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);
    INSERT OR IGNORE INTO schema_version (version) VALUES (1);

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      budget_amount REAL DEFAULT 0,
      color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      category_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transaction_tags (
      transaction_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (transaction_id, tag_id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  `)

  runMigrations()

  // Seed default categories if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }
  if (count.c === 0) {
    const insert = db.prepare('INSERT INTO categories (name, type, color) VALUES (?, ?, ?)')
    const defaults = [
      ['Salary', 'income', '#22c55e'],
      ['Freelance', 'income', '#10b981'],
      ['Investments', 'income', '#14b8a6'],
      ['Other Income', 'income', '#06b6d4'],
      ['Rent', 'expense', '#ef4444'],
      ['Groceries', 'expense', '#f97316'],
      ['Transport', 'expense', '#eab308'],
      ['Entertainment', 'expense', '#a855f7'],
      ['Utilities', 'expense', '#6366f1'],
      ['Healthcare', 'expense', '#ec4899'],
      ['Education', 'expense', '#3b82f6'],
      ['Shopping', 'expense', '#8b5cf6'],
      ['Dining', 'expense', '#f43f5e'],
      ['Other Expense', 'expense', '#64748b'],
    ]
    const insertMany = db.transaction((items: string[][]) => {
      for (const item of items) insert.run(item[0], item[1], item[2])
    })
    insertMany(defaults)
  }
}

function runMigrations() {
  const version = (db.prepare('SELECT version FROM schema_version').get() as { version: number } | undefined)?.version ?? 1

  if (version < 2) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'saving', 'investment', 'loan', 'account_payable', 'account_receivable', 'capital')),
        initial_balance REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
    `)
    try { db.exec('ALTER TABLE transactions ADD COLUMN account_id INTEGER REFERENCES accounts(id)') } catch (_) { }
    try { db.exec('ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(id)') } catch (_) { }
    try { db.exec('ALTER TABLE categories ADD COLUMN icon TEXT') } catch (_) { }
    db.exec(`
      CREATE TABLE IF NOT EXISTS recurring_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT,
        amount REAL NOT NULL,
        category_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
        next_run TEXT NOT NULL,
        end_date TEXT,
        is_active INTEGER DEFAULT 1,
        account_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      );
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        due_date TEXT NOT NULL,
        amount REAL,
        description TEXT,
        recurring_id INTEGER,
        paid_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recurring_id) REFERENCES recurring_templates(id)
      );
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_currency TEXT NOT NULL,
        to_currency TEXT NOT NULL,
        rate REAL NOT NULL,
        as_of_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)
    try { db.exec('ALTER TABLE transactions ADD COLUMN currency TEXT DEFAULT \'GBP\'') } catch (_) { }
    try { db.exec('ALTER TABLE transactions ADD COLUMN original_amount REAL') } catch (_) { }
    try { db.exec('ALTER TABLE transactions ADD COLUMN phase_tag TEXT') } catch (_) { }
    db.prepare('UPDATE schema_version SET version = 2').run()
  }

  if (version < 3) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)
    db.prepare('UPDATE schema_version SET version = 3').run()
  }
}

// ─── IPC Handlers ────────────────────────────────────────────

function registerIpcHandlers() {
  // ── Categories ──
  ipcMain.handle('db:getCategories', (_event, type?: string) => {
    if (type) {
      return db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY name').all(type)
    }
    return db.prepare('SELECT * FROM categories ORDER BY type, name').all()
  })

  ipcMain.handle('db:createCategory', (_event, data: { name: string; type: string; color?: string; parent_id?: number | null }) => {
    const stmt = db.prepare('INSERT INTO categories (name, type, color, parent_id) VALUES (?, ?, ?, ?)')
    const result = stmt.run(data.name, data.type, data.color || '#6366f1', data.parent_id ?? null)
    return { id: result.lastInsertRowid, ...data }
  })

  ipcMain.handle('db:deleteCategory', (_event, id: number) => {
    db.prepare('DELETE FROM categories WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('db:updateCategoryBudget', (_event, id: number, amount: number) => {
    db.prepare('UPDATE categories SET budget_amount = ? WHERE id = ?').run(amount, id)
    return { success: true }
  })

  ipcMain.handle('db:updateCategory', (_event, id: number, data: { name?: string; type?: string; color?: string; parent_id?: number | null; icon?: string | null }) => {
    const updates: string[] = []
    const params: any[] = []
    if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name) }
    if (data.type !== undefined) { updates.push('type = ?'); params.push(data.type) }
    if (data.color !== undefined) { updates.push('color = ?'); params.push(data.color) }
    if (data.parent_id !== undefined) { updates.push('parent_id = ?'); params.push(data.parent_id) }
    if (data.icon !== undefined) { updates.push('icon = ?'); params.push(data.icon) }
    if (updates.length === 0) return { success: true }
    params.push(id)
    db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    return { success: true }
  })

  // ── Accounts ──
  ipcMain.handle('db:getAccounts', () => {
    return db.prepare('SELECT * FROM accounts ORDER BY type, name').all()
  })

  ipcMain.handle('db:createAccount', (_event, data: { name: string; type: string; initial_balance?: number }) => {
    const stmt = db.prepare('INSERT INTO accounts (name, type, initial_balance) VALUES (?, ?, ?)')
    const result = stmt.run(data.name, data.type, data.initial_balance ?? 0)
    return { id: result.lastInsertRowid, ...data }
  })

  ipcMain.handle('db:updateAccount', (_event, id: number, data: { name?: string; type?: string; initial_balance?: number }) => {
    const updates: string[] = []
    const params: any[] = []
    if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name) }
    if (data.type !== undefined) { updates.push('type = ?'); params.push(data.type) }
    if (data.initial_balance !== undefined) { updates.push('initial_balance = ?'); params.push(data.initial_balance) }
    if (updates.length === 0) return { success: true }
    params.push(id)
    db.prepare(`UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    return { success: true }
  })

  ipcMain.handle('db:deleteAccount', (_event, id: number) => {
    db.prepare('UPDATE transactions SET account_id = NULL WHERE account_id = ?').run(id)
    db.prepare('DELETE FROM accounts WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('db:getAccountBalances', () => {
    const accounts = db.prepare('SELECT * FROM accounts ORDER BY type, name').all() as { id: number; name: string; type: string; initial_balance: number }[]
    const getBalance = db.prepare(`
      SELECT
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE account_id = ? AND type = 'income') -
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE account_id = ? AND type = 'expense') as net
    `)
    return accounts.map(a => {
      const row = getBalance.get(a.id, a.id) as { net: number }
      const balance = (a.initial_balance ?? 0) + (row?.net ?? 0)
      return { ...a, balance }
    })
  })

  // ── P&L and Balance Sheet (Legacy) ──
  ipcMain.handle('db:getPlReport', () => {
    const totalDr = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'").get() as { total: number }
    const totalCr = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'").get() as { total: number }
    const netPl = totalCr.total - totalDr.total
    return { totalDebit: totalDr.total, totalCredit: totalCr.total, netPl, netLoss: netPl < 0 ? Math.abs(netPl) : 0 }
  })

  ipcMain.handle('db:getBalanceSheet', () => {
    try {
      const accounts = db.prepare('SELECT * FROM accounts ORDER BY type, name').all() as { id: number; name: string; type: string; initial_balance: number }[]
      const getBalance = db.prepare(`
        SELECT
          (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE account_id = ? AND type = 'income') -
          (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE account_id = ? AND type = 'expense') as net
      `)
      const withBalance = accounts.map(a => {
        const row = getBalance.get(a.id, a.id) as { net: number }
        return { ...a, balance: (a.initial_balance ?? 0) + (row?.net ?? 0) }
      })
      const assetTypes = ['cash', 'bank', 'saving', 'investment', 'account_receivable']
      const liabilityTypes = ['loan', 'account_payable', 'capital']
      const assets = withBalance.filter(a => assetTypes.includes(a.type))
      const liabilities = withBalance.filter(a => liabilityTypes.includes(a.type))
      const pl = db.prepare("SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) as net FROM transactions").get() as { net: number }
      const netLoss = pl.net < 0 ? Math.abs(pl.net) : 0
      if (netLoss > 0) liabilities.push({ id: -1, name: 'Net Loss', type: 'equity', initial_balance: 0, balance: netLoss } as any)
      const totalAssets = assets.reduce((s, a) => s + a.balance, 0)
      const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0)
      return { assets, liabilities, totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities }
    } catch {
      const pl = db.prepare("SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) as net FROM transactions").get() as { net: number }
      return { assets: [], liabilities: [], totalAssets: 0, totalLiabilities: Math.abs(Math.min(0, pl.net)), netWorth: pl.net }
    }
  })

  // ── Tags ──
  ipcMain.handle('db:getTags', () => {
    return db.prepare('SELECT * FROM tags ORDER BY name').all()
  })

  ipcMain.handle('db:createTag', (_event, data: { name: string; color?: string }) => {
    const stmt = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)')
    const result = stmt.run(data.name, data.color || '#6366f1')
    return { id: result.lastInsertRowid, ...data }
  })

  ipcMain.handle('db:updateTag', (_event, id: number, data: { name?: string; color?: string }) => {
    const updates: string[] = []
    const params: any[] = []
    if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name) }
    if (data.color !== undefined) { updates.push('color = ?'); params.push(data.color) }
    if (updates.length === 0) return { success: true }
    params.push(id)
    db.prepare(`UPDATE tags SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    return { success: true }
  })

  ipcMain.handle('db:deleteTag', (_event, id: number) => {
    db.prepare('DELETE FROM tags WHERE id = ?').run(id)
    return { success: true }
  })

  // ── Transactions ──
  ipcMain.handle('db:getTransactions', (_event, filters?: {
    type?: string; categoryId?: number; tagId?: number; accountId?: number;
    startDate?: string; endDate?: string; search?: string;
    limit?: number; offset?: number
  }) => {
    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.type as category_type
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `
    const params: any[] = []

    if (filters?.type) { query += ' AND t.type = ?'; params.push(filters.type) }
    if (filters?.categoryId) { query += ' AND t.category_id = ?'; params.push(filters.categoryId) }
    if (filters?.accountId) { query += ' AND t.account_id = ?'; params.push(filters.accountId) }
    if (filters?.startDate) { query += ' AND t.date >= ?'; params.push(filters.startDate) }
    if (filters?.endDate) { query += ' AND t.date <= ?'; params.push(filters.endDate) }
    if (filters?.search) { query += ' AND t.description LIKE ?'; params.push(`%${filters.search}%`) }

    if (filters?.tagId) {
      query += ' AND t.id IN (SELECT transaction_id FROM transaction_tags WHERE tag_id = ?)'
      params.push(filters.tagId)
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC'
    if (filters?.limit) { query += ' LIMIT ?'; params.push(filters.limit) }
    if (filters?.offset) { query += ' OFFSET ?'; params.push(filters.offset) }

    const transactions = db.prepare(query).all(...params) as any[]

    const tagStmt = db.prepare(`
      SELECT t.* FROM tags t
      JOIN transaction_tags tt ON t.id = tt.tag_id
      WHERE tt.transaction_id = ?
    `)
    return transactions.map(tx => ({
      ...tx,
      tags: tagStmt.all(tx.id)
    }))
  })

  ipcMain.handle('db:getTransaction', (_event, id: number) => {
    const tx = db.prepare(`
      SELECT t.*, c.name as category_name, c.color as category_color, c.type as category_type
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(id) as any
    if (!tx) return null
    const tags = db.prepare(`
      SELECT tg.* FROM tags tg
      JOIN transaction_tags tt ON tg.id = tt.tag_id
      WHERE tt.transaction_id = ?
    `).all(id)
    return { ...tx, tags }
  })

  ipcMain.handle('db:bulkDeleteTransactions', (_event, ids: number[]) => {
    if (!ids?.length) return { deleted: 0 }
    const stmt = db.prepare('DELETE FROM transactions WHERE id = ?')
    const delTags = db.prepare('DELETE FROM transaction_tags WHERE transaction_id = ?')
    db.transaction(() => {
      for (const id of ids) {
        delTags.run(id)
        stmt.run(id)
      }
    })()
    return { deleted: ids.length }
  })

  ipcMain.handle('db:bulkUpdateTransactionCategory', (_event, ids: number[], categoryId: number) => {
    if (!ids?.length) return { updated: 0 }
    const stmt = db.prepare('UPDATE transactions SET category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    db.transaction(() => {
      for (const id of ids) {
        stmt.run(categoryId, id)
      }
    })()
    return { updated: ids.length }
  })

  ipcMain.handle('db:createTransaction', (_event, data: {
    date: string; amount: number; description: string;
    category_id: number; type: string; tagIds?: number[]; account_id?: number | null; currency?: string
  }) => {
    const defaultCurrency = (db.prepare('SELECT value FROM preferences WHERE key = ?').get('default_currency') as { value: string } | undefined)?.value ?? 'USD'
    const currency = data.currency ?? defaultCurrency
    const insertTx = db.prepare(`
      INSERT INTO transactions (date, amount, description, category_id, type, account_id, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const insertTag = db.prepare('INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)')

    const result = db.transaction(() => {
      const res = insertTx.run(data.date, data.amount, data.description, data.category_id, data.type, data.account_id ?? null, currency)
      const txId = res.lastInsertRowid
      if (data.tagIds && data.tagIds.length > 0) {
        for (const tagId of data.tagIds) {
          insertTag.run(txId, tagId)
        }
      }
      return txId
    })()

    return { id: result }
  })

  ipcMain.handle('db:updateTransaction', (_event, id: number, data: {
    date: string; amount: number; description: string;
    category_id: number; type: string; tagIds?: number[]; account_id?: number | null; currency?: string
  }) => {
    const updates: string[] = ['date = ?', 'amount = ?', 'description = ?', 'category_id = ?', 'type = ?', 'updated_at = CURRENT_TIMESTAMP', 'account_id = ?']
    const params: any[] = [data.date, data.amount, data.description, data.category_id, data.type, data.account_id ?? null]
    if (data.currency !== undefined) {
      updates.push('currency = ?')
      params.push(data.currency)
    }
    params.push(id)
    const updateTx = db.prepare(`
      UPDATE transactions SET ${updates.join(', ')}
      WHERE id = ?
    `)
    const deleteTags = db.prepare('DELETE FROM transaction_tags WHERE transaction_id = ?')
    const insertTag = db.prepare('INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)')

    db.transaction(() => {
      updateTx.run(...params)
      deleteTags.run(id)
      if (data.tagIds && data.tagIds.length > 0) {
        for (const tagId of data.tagIds) {
          insertTag.run(id, tagId)
        }
      }
    })()

    return { success: true }
  })

  ipcMain.handle('db:deleteTransaction', (_event, id: number) => {
    db.prepare('DELETE FROM transaction_tags WHERE transaction_id = ?').run(id)
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
    return { success: true }
  })

  // ── Dashboard Summary ──
  ipcMain.handle('db:getDashboardSummary', () => {
    const totalIncome = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'"
    ).get() as { total: number }

    const totalExpense = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'"
    ).get() as { total: number }

    // Monthly trends (last 6 months)
    const monthlyTrends = db.prepare(`
      SELECT
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `).all()

    // Category breakdown (expenses)
    const categoryBreakdown = db.prepare(`
      SELECT c.name, c.color, SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense'
      GROUP BY c.id
      ORDER BY total DESC
    `).all()

    // Daily cash flow (last 30 days)
    const dailyCashFlow = db.prepare(`
      SELECT
        date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net
      FROM transactions
      WHERE date >= date('now', '-30 days')
      GROUP BY date
      ORDER BY date ASC
    `).all()

    // Recent transactions
    const recentTransactions = db.prepare(`
      SELECT t.*, c.name as category_name, c.color as category_color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 10
    `).all() as any[]

    const tagStmt = db.prepare(`
      SELECT tg.* FROM tags tg
      JOIN transaction_tags tt ON tg.id = tt.tag_id
      WHERE tt.transaction_id = ?
    `)
    const recentWithTags = recentTransactions.map(tx => ({
      ...tx,
      tags: tagStmt.all(tx.id)
    }))

    // Top spending categories
    const topCategories = db.prepare(`
      SELECT c.name, c.color, SUM(t.amount) as total, c.budget_amount
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense'
      GROUP BY c.id
      ORDER BY total DESC
      LIMIT 5
    `).all()

    // Monthly income & expense for current month
    const currentMonth = db.prepare(`
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `).get()

    return {
      totalIncome: totalIncome.total,
      totalExpense: totalExpense.total,
      netBalance: totalIncome.total - totalExpense.total,
      savingsRate: totalIncome.total > 0
        ? ((totalIncome.total - totalExpense.total) / totalIncome.total * 100)
        : 0,
      monthlyTrends,
      categoryBreakdown,
      dailyCashFlow,
      recentTransactions: recentWithTags,
      topCategories,
      currentMonth,
    }
  })

  // ── Budget Overview ──
  ipcMain.handle('db:getBudgetOverview', () => {
    return db.prepare(`
      SELECT
        c.id, c.name, c.color, c.budget_amount,
        COALESCE(SUM(t.amount), 0) as spent
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
        AND t.type = 'expense'
        AND strftime('%Y-%m', t.date) = strftime('%Y-%m', 'now')
      WHERE c.type = 'expense'
      GROUP BY c.id
      ORDER BY c.name
    `).all()
  })

  // ── Reports ──
  ipcMain.handle('db:getReportData', (_event, period: 'monthly' | 'quarterly' | 'yearly') => {
    let groupExpr: string
    if (period === 'monthly') groupExpr = "strftime('%Y-%m', date)"
    else if (period === 'quarterly') groupExpr = "strftime('%Y', date) || '-Q' || ((CAST(strftime('%m', date) AS INTEGER) - 1) / 3 + 1)"
    else groupExpr = "strftime('%Y', date)"

    const summary = db.prepare(`
      SELECT
        ${groupExpr} as period,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      GROUP BY ${groupExpr}
      ORDER BY period DESC
    `).all()

    const categoryWise = db.prepare(`
      SELECT
        ${groupExpr} as period,
        c.name as category,
        c.color,
        SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense'
      GROUP BY ${groupExpr}, c.id
      ORDER BY period DESC, total DESC
    `).all()

    const incomeBySource = db.prepare(`
      SELECT
        ${groupExpr} as period,
        c.name as source,
        c.color,
        SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'income'
      GROUP BY ${groupExpr}, c.id
      ORDER BY period DESC, total DESC
    `).all()

    return { summary, categoryWise, incomeBySource }
  })

  ipcMain.handle('db:exportTransactionsToCsv', (_event, filters?: { startDate?: string; endDate?: string }) => {
    let query = `
      SELECT t.date, t.amount, t.description, t.type, c.name as category_name
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `
    const params: any[] = []
    if (filters?.startDate) { query += ' AND t.date >= ?'; params.push(filters.startDate) }
    if (filters?.endDate) { query += ' AND t.date <= ?'; params.push(filters.endDate) }
    query += ' ORDER BY t.date DESC'
    const rows = db.prepare(query).all(...params) as { date: string; amount: number; description: string; type: string; category_name: string }[]
    const header = 'Date,Amount,Description,Type,Category'
    const lines = [header, ...rows.map(r => [r.date, r.amount, r.description || '', r.type, r.category_name || ''].map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))]
    return lines.join('\n')
  })

  // ── Recurring ──
  ipcMain.handle('db:getRecurringTemplates', () => {
    return db.prepare(`
      SELECT r.*, c.name as category_name, c.color as category_color
      FROM recurring_templates r
      JOIN categories c ON r.category_id = c.id
      ORDER BY r.next_run ASC
    `).all()
  })

  ipcMain.handle('db:createRecurringTemplate', (_event, data: {
    description: string; amount: number; category_id: number; type: string;
    frequency: string; next_run: string; end_date?: string | null; account_id?: number | null
  }) => {
    const stmt = db.prepare(`
      INSERT INTO recurring_templates (description, amount, category_id, type, frequency, next_run, end_date, account_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(data.description, data.amount, data.category_id, data.type, data.frequency, data.next_run, data.end_date ?? null, data.account_id ?? null)
    return { id: result.lastInsertRowid }
  })

  ipcMain.handle('db:updateRecurringTemplate', (_event, id: number, data: {
    description?: string; amount?: number; category_id?: number; type?: string;
    frequency?: string; next_run?: string; end_date?: string | null; is_active?: number; account_id?: number | null
  }) => {
    const updates: string[] = []
    const params: any[] = []
    const fields: (keyof typeof data)[] = ['description', 'amount', 'category_id', 'type', 'frequency', 'next_run', 'end_date', 'is_active', 'account_id']
    for (const k of fields) {
      if (data[k] !== undefined) { updates.push(`${k} = ?`); params.push(data[k]) }
    }
    if (updates.length === 0) return { success: true }
    params.push(id)
    db.prepare(`UPDATE recurring_templates SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    return { success: true }
  })

  ipcMain.handle('db:deleteRecurringTemplate', (_event, id: number) => {
    db.prepare('DELETE FROM reminders WHERE recurring_id = ?').run(id)
    db.prepare('DELETE FROM recurring_templates WHERE id = ?').run(id)
    return { success: true }
  })

  // ── Reminders ──
  ipcMain.handle('db:getReminders', (_event, options?: { includePaid?: boolean }) => {
    let query = 'SELECT * FROM reminders'
    if (!options?.includePaid) query += ' WHERE paid_at IS NULL'
    query += ' ORDER BY due_date ASC'
    return db.prepare(query).all()
  })

  ipcMain.handle('db:createReminder', (_event, data: { title: string; due_date: string; amount?: number; description?: string; recurring_id?: number | null }) => {
    const stmt = db.prepare('INSERT INTO reminders (title, due_date, amount, description, recurring_id) VALUES (?, ?, ?, ?, ?)')
    const result = stmt.run(data.title, data.due_date, data.amount ?? null, data.description ?? null, data.recurring_id ?? null)
    return { id: result.lastInsertRowid }
  })

  ipcMain.handle('db:updateReminder', (_event, id: number, data: { title?: string; due_date?: string; amount?: number; description?: string; paid_at?: string | null }) => {
    const updates: string[] = []
    const params: any[] = []
    if (data.title !== undefined) { updates.push('title = ?'); params.push(data.title) }
    if (data.due_date !== undefined) { updates.push('due_date = ?'); params.push(data.due_date) }
    if (data.amount !== undefined) { updates.push('amount = ?'); params.push(data.amount) }
    if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description) }
    if (data.paid_at !== undefined) { updates.push('paid_at = ?'); params.push(data.paid_at) }
    if (updates.length === 0) return { success: true }
    params.push(id)
    db.prepare(`UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    return { success: true }
  })

  ipcMain.handle('db:deleteReminder', (_event, id: number) => {
    db.prepare('DELETE FROM reminders WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('db:markReminderPaid', (_event, id: number) => {
    db.prepare('UPDATE reminders SET paid_at = datetime("now") WHERE id = ?').run(id)
    return { success: true }
  })

  // ── Exchange rates ──
  ipcMain.handle('db:getExchangeRate', (_event, fromCurrency: string, toCurrency: string) => {
    const row = db.prepare(
      'SELECT * FROM exchange_rates WHERE from_currency = ? AND to_currency = ? ORDER BY as_of_date DESC LIMIT 1'
    ).get(fromCurrency, toCurrency)
    return row
  })

  ipcMain.handle('db:setExchangeRate', (_event, data: { from_currency: string; to_currency: string; rate: number; as_of_date: string }) => {
    db.prepare('INSERT INTO exchange_rates (from_currency, to_currency, rate, as_of_date) VALUES (?, ?, ?, ?)').run(
      data.from_currency, data.to_currency, data.rate, data.as_of_date
    )
    return { success: true }
  })

  // ── Preferences ──
  ipcMain.handle('prefs:get', (_event, key: string) => {
    const row = db.prepare('SELECT value FROM preferences WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value ?? null
  })
  ipcMain.handle('prefs:set', (_event, key: string, value: string) => {
    db.prepare('INSERT INTO preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?').run(key, value, value)
    return { success: true }
  })

  // ── Backup ──
  ipcMain.handle('app:getUserDataPath', () => app.getPath('userData'))
  ipcMain.handle('app:showNotification', (_event, opts: { title: string; body?: string }) => {
    const { Notification } = require('electron')
    if (Notification.isSupported()) {
      new Notification({ title: opts.title, body: opts.body || '' }).show()
    }
  })

  // ── Database Management ──
  ipcMain.handle('db:backupDatabase', async () => {
    const dbPath = path.join(app.getPath('userData'), 'finance.db')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')
    const defaultName = `finance-backup-${timestamp[0]}_${timestamp[1].slice(0, 8)}.db`

    const result = await dialog.showSaveDialog({
      title: 'Save Database Backup',
      defaultPath: defaultName,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    })

    if (result.canceled || !result.filePath) return { success: false, canceled: true }

    // Checkpoint WAL to ensure all data is in the main db file
    db.pragma('wal_checkpoint(TRUNCATE)')
    fs.copyFileSync(dbPath, result.filePath)
    return { success: true, path: result.filePath }
  })

  ipcMain.handle('db:clearDatabase', () => {
    db.exec(`
      DELETE FROM transaction_tags;
      DELETE FROM transactions;
      DELETE FROM reminders;
      DELETE FROM recurring_templates;
      DELETE FROM exchange_rates;
      DELETE FROM tags;
      DELETE FROM categories;
      DELETE FROM accounts;
      DELETE FROM preferences;
    `)

    // Re-seed default categories
    const insert = db.prepare('INSERT INTO categories (name, type, color) VALUES (?, ?, ?)')
    const defaults = [
      ['Salary', 'income', '#22c55e'],
      ['Freelance', 'income', '#10b981'],
      ['Investments', 'income', '#14b8a6'],
      ['Other Income', 'income', '#06b6d4'],
      ['Rent', 'expense', '#ef4444'],
      ['Groceries', 'expense', '#f97316'],
      ['Transport', 'expense', '#eab308'],
      ['Entertainment', 'expense', '#a855f7'],
      ['Utilities', 'expense', '#6366f1'],
      ['Healthcare', 'expense', '#ec4899'],
      ['Education', 'expense', '#3b82f6'],
      ['Shopping', 'expense', '#8b5cf6'],
      ['Dining', 'expense', '#f43f5e'],
      ['Other Expense', 'expense', '#64748b'],
    ]
    db.transaction(() => {
      for (const item of defaults) insert.run(item[0], item[1], item[2])
    })()

    return { success: true }
  })

  ipcMain.handle('db:exportToExcel', async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')
    const defaultName = `finance-export-${timestamp[0]}_${timestamp[1].slice(0, 8)}.xlsx`

    const result = await dialog.showSaveDialog({
      title: 'Export Data as Excel',
      defaultPath: defaultName,
      filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
    })

    if (result.canceled || !result.filePath) return { success: false, canceled: true }

    const wb = XLSX.utils.book_new()

    // ── Transactions sheet ──
    const transactions = db.prepare(`
      SELECT t.id, t.date, t.amount, t.currency, t.description, t.type,
        c.name as category, a.name as account
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      ORDER BY t.date DESC
    `).all() as any[]
    // Add tags as comma-separated
    const tagStmt = db.prepare(`
      SELECT tg.name FROM tags tg
      JOIN transaction_tags tt ON tg.id = tt.tag_id
      WHERE tt.transaction_id = ?
    `)
    const txRows = transactions.map(t => ({
      ID: t.id,
      Date: t.date,
      Amount: t.amount,
      Currency: t.currency || '',
      Description: t.description || '',
      Type: t.type,
      Category: t.category || '',
      Account: t.account || '',
      Tags: (tagStmt.all(t.id) as { name: string }[]).map(tg => tg.name).join(', '),
    }))
    const wsTx = XLSX.utils.json_to_sheet(txRows)
    XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions')

    // ── Categories sheet ──
    const categories = db.prepare('SELECT id, name, type, budget_amount, color FROM categories ORDER BY type, name').all()
    const wsCat = XLSX.utils.json_to_sheet(categories as any[])
    XLSX.utils.book_append_sheet(wb, wsCat, 'Categories')

    // ── Accounts sheet ──
    const accounts = db.prepare('SELECT id, name, type, initial_balance FROM accounts ORDER BY type, name').all()
    const wsAcc = XLSX.utils.json_to_sheet(accounts as any[])
    XLSX.utils.book_append_sheet(wb, wsAcc, 'Accounts')

    // ── Tags sheet ──
    const tags = db.prepare('SELECT id, name, color FROM tags ORDER BY name').all()
    const wsTag = XLSX.utils.json_to_sheet(tags as any[])
    XLSX.utils.book_append_sheet(wb, wsTag, 'Tags')

    // ── Recurring sheet ──
    const recurring = db.prepare(`
      SELECT r.id, r.description, r.amount, r.type, r.frequency, r.next_run, r.end_date, r.is_active,
        c.name as category
      FROM recurring_templates r
      LEFT JOIN categories c ON r.category_id = c.id
      ORDER BY r.next_run
    `).all()
    const wsRec = XLSX.utils.json_to_sheet(recurring as any[])
    XLSX.utils.book_append_sheet(wb, wsRec, 'Recurring')

    // ── Reminders sheet ──
    const reminders = db.prepare('SELECT id, title, due_date, amount, description, paid_at FROM reminders ORDER BY due_date').all()
    const wsRem = XLSX.utils.json_to_sheet(reminders as any[])
    XLSX.utils.book_append_sheet(wb, wsRem, 'Reminders')

    XLSX.writeFile(wb, result.filePath)
    return { success: true, path: result.filePath }
  })

  ipcMain.handle('db:getDatabaseStats', () => {
    const dbPath = path.join(app.getPath('userData'), 'finance.db')
    const stats = fs.statSync(dbPath)
    const tables = [
      { name: 'Transactions', query: 'SELECT COUNT(*) as count FROM transactions' },
      { name: 'Categories', query: 'SELECT COUNT(*) as count FROM categories' },
      { name: 'Accounts', query: 'SELECT COUNT(*) as count FROM accounts' },
      { name: 'Tags', query: 'SELECT COUNT(*) as count FROM tags' },
      { name: 'Recurring Templates', query: 'SELECT COUNT(*) as count FROM recurring_templates' },
      { name: 'Reminders', query: 'SELECT COUNT(*) as count FROM reminders' },
      { name: 'Exchange Rates', query: 'SELECT COUNT(*) as count FROM exchange_rates' },
    ]
    const tableCounts = tables.map(t => ({
      name: t.name,
      count: (db.prepare(t.query).get() as { count: number }).count,
    }))
    return {
      fileSize: stats.size,
      tables: tableCounts,
      path: dbPath,
    }
  })

  // ── Import CSV ──
  ipcMain.handle('db:importCsv', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import Transactions from CSV',
      filters: [
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })

    if (result.canceled || !result.filePaths.length) return { success: false, canceled: true }

    const filePath = result.filePaths[0]
    const raw = fs.readFileSync(filePath, 'utf-8')
    const lines = raw.split(/\r?\n/).filter(l => l.trim())

    if (lines.length < 2) return { success: false, error: 'CSV file is empty or has no data rows' }

    // Parse header
    const headerLine = lines[0]
    const headers = parseCsvLine(headerLine).map(h => h.trim().toLowerCase())

    // Identify column indices
    const dateIdx = headers.findIndex(h => h === 'date')
    const amountIdx = headers.findIndex(h => h === 'amount')
    const descIdx = headers.findIndex(h => ['description', 'desc', 'memo', 'note', 'notes'].includes(h))
    const typeIdx = headers.findIndex(h => h === 'type')
    const categoryIdx = headers.findIndex(h => ['category', 'category_name'].includes(h))
    const currencyIdx = headers.findIndex(h => h === 'currency')
    const accountIdx = headers.findIndex(h => ['account', 'account_name'].includes(h))
    const tagsIdx = headers.findIndex(h => ['tags', 'tag'].includes(h))

    if (dateIdx === -1 || amountIdx === -1) {
      return { success: false, error: 'CSV must have at least "Date" and "Amount" columns' }
    }

    const defaultCurrency = (db.prepare('SELECT value FROM preferences WHERE key = ?').get('default_currency') as { value: string } | undefined)?.value ?? 'USD'

    // Cache categories & accounts & tags
    const categoryCache = new Map<string, number>()
      ; (db.prepare('SELECT id, name FROM categories').all() as { id: number; name: string }[]).forEach(c => categoryCache.set(c.name.toLowerCase(), c.id))

    const accountCache = new Map<string, number>()
      ; (db.prepare('SELECT id, name FROM accounts').all() as { id: number; name: string }[]).forEach(a => accountCache.set(a.name.toLowerCase(), a.id))

    const tagCache = new Map<string, number>()
      ; (db.prepare('SELECT id, name FROM tags').all() as { id: number; name: string }[]).forEach(t => tagCache.set(t.name.toLowerCase(), t.id))

    const insertCategory = db.prepare('INSERT INTO categories (name, type, color) VALUES (?, ?, ?)')
    const insertAccount = db.prepare("INSERT INTO accounts (name, type, initial_balance) VALUES (?, 'bank', 0)")
    const insertTag = db.prepare("INSERT INTO tags (name, color) VALUES (?, '#6366f1')")
    const insertTx = db.prepare(`
      INSERT INTO transactions (date, amount, description, category_id, type, account_id, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const insertTxTag = db.prepare('INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)')

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    const doImport = db.transaction(() => {
      for (let i = 1; i < lines.length; i++) {
        try {
          const cols = parseCsvLine(lines[i])
          const dateVal = cols[dateIdx]?.trim()
          const amountVal = parseFloat(cols[amountIdx]?.trim())

          if (!dateVal || isNaN(amountVal)) {
            skipped++
            errors.push(`Row ${i + 1}: invalid date or amount`)
            continue
          }

          const description = descIdx >= 0 ? (cols[descIdx]?.trim() || '') : ''
          let type = typeIdx >= 0 ? (cols[typeIdx]?.trim().toLowerCase() || '') : ''
          if (!['income', 'expense'].includes(type)) {
            type = amountVal >= 0 ? 'income' : 'expense'
          }

          const amount = Math.abs(amountVal)
          const currency = currencyIdx >= 0 ? (cols[currencyIdx]?.trim() || defaultCurrency) : defaultCurrency

          // Resolve category
          const categoryName = categoryIdx >= 0 ? (cols[categoryIdx]?.trim() || '') : ''
          let categoryId: number
          if (categoryName && categoryCache.has(categoryName.toLowerCase())) {
            categoryId = categoryCache.get(categoryName.toLowerCase())!
          } else if (categoryName) {
            const color = type === 'income' ? '#22c55e' : '#6366f1'
            const res = insertCategory.run(categoryName, type, color)
            categoryId = Number(res.lastInsertRowid)
            categoryCache.set(categoryName.toLowerCase(), categoryId)
          } else {
            // Fallback to "Other Income" or "Other Expense"
            const fallback = type === 'income' ? 'other income' : 'other expense'
            if (categoryCache.has(fallback)) {
              categoryId = categoryCache.get(fallback)!
            } else {
              const res = insertCategory.run(type === 'income' ? 'Other Income' : 'Other Expense', type, '#64748b')
              categoryId = Number(res.lastInsertRowid)
              categoryCache.set(fallback, categoryId)
            }
          }

          // Resolve account
          let accountId: number | null = null
          if (accountIdx >= 0) {
            const accountName = cols[accountIdx]?.trim()
            if (accountName) {
              if (accountCache.has(accountName.toLowerCase())) {
                accountId = accountCache.get(accountName.toLowerCase())!
              } else {
                const res = insertAccount.run(accountName)
                accountId = Number(res.lastInsertRowid)
                accountCache.set(accountName.toLowerCase(), accountId)
              }
            }
          }

          const txRes = insertTx.run(dateVal, amount, description, categoryId, type, accountId, currency)
          const txId = Number(txRes.lastInsertRowid)

          // Resolve tags
          if (tagsIdx >= 0) {
            const tagsStr = cols[tagsIdx]?.trim()
            if (tagsStr) {
              const tagNames = tagsStr.split(',').map(t => t.trim()).filter(Boolean)
              for (const tagName of tagNames) {
                let tagId: number
                if (tagCache.has(tagName.toLowerCase())) {
                  tagId = tagCache.get(tagName.toLowerCase())!
                } else {
                  const res = insertTag.run(tagName)
                  tagId = Number(res.lastInsertRowid)
                  tagCache.set(tagName.toLowerCase(), tagId)
                }
                insertTxTag.run(txId, tagId)
              }
            }
          }

          imported++
        } catch (err: any) {
          skipped++
          errors.push(`Row ${i + 1}: ${err.message}`)
        }
      }
    })

    doImport()

    return { success: true, imported, skipped, errors: errors.slice(0, 10) }
  })

  // ── Restore Database from .db file ──
  ipcMain.handle('db:restoreDatabase', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Restore Database from Backup',
      filters: [
        { name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] },
      ],
      properties: ['openFile'],
    })

    if (result.canceled || !result.filePaths.length) return { success: false, canceled: true }

    const sourcePath = result.filePaths[0]
    const dbPath = path.join(app.getPath('userData'), 'finance.db')

    try {
      // Validate that the source is a valid SQLite file
      const testDb = new Database(sourcePath, { readonly: true })
      testDb.prepare('SELECT 1').get()
      testDb.close()

      // Close current db, copy, re-open
      db.close()
      fs.copyFileSync(sourcePath, dbPath)
      db = new Database(dbPath)
      db.pragma('journal_mode = WAL')
      db.pragma('foreign_keys = ON')

      return { success: true }
    } catch (err: any) {
      // If db was closed and copy failed, re-open the original
      try {
        db = new Database(dbPath)
        db.pragma('journal_mode = WAL')
        db.pragma('foreign_keys = ON')
      } catch (_) { }
      return { success: false, error: err.message || 'Invalid database file' }
    }
  })
}

// Helper: parse a single CSV line respecting quoted fields
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: '#0c0f1a',
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  return mainWindow
}

function runRecurringJob() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const due = db.prepare(`
      SELECT * FROM recurring_templates
      WHERE is_active = 1 AND next_run <= ? AND (end_date IS NULL OR end_date >= ?)
    `).all(today, today) as { id: number; description: string; amount: number; category_id: number; type: string; frequency: string; next_run: string; end_date: string | null; account_id: number | null }[]

    const defaultCurrency = (db.prepare('SELECT value FROM preferences WHERE key = ?').get('default_currency') as { value: string } | undefined)?.value ?? 'USD'
    const insertTx = db.prepare(`
      INSERT INTO transactions (date, amount, description, category_id, type, account_id, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const advanceNextRun = db.prepare(`
      UPDATE recurring_templates SET next_run = ? WHERE id = ?
    `)

    for (const r of due) {
      db.transaction(() => {
        insertTx.run(r.next_run, r.amount, r.description || 'Recurring', r.category_id, r.type, r.account_id, defaultCurrency)
        let next = r.next_run
        if (r.frequency === 'daily') {
          const d = new Date(next)
          d.setDate(d.getDate() + 1)
          next = d.toISOString().split('T')[0]
        } else if (r.frequency === 'weekly') {
          const d = new Date(next)
          d.setDate(d.getDate() + 7)
          next = d.toISOString().split('T')[0]
        } else if (r.frequency === 'monthly') {
          const d = new Date(next)
          d.setMonth(d.getMonth() + 1)
          next = d.toISOString().split('T')[0]
        } else if (r.frequency === 'yearly') {
          const d = new Date(next)
          d.setFullYear(d.getFullYear() + 1)
          next = d.toISOString().split('T')[0]
        }
        advanceNextRun.run(next, r.id)
      })()
    }
  } catch (err) {
    console.error('Recurring job error:', err)
  }
}

app.whenReady().then(() => {
  initDatabase()
  registerIpcHandlers()
  createWindow()

  runRecurringJob()
  setInterval(runRecurringJob, 60 * 60 * 1000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    db.close()
    app.quit()
  }
})

app.on('before-quit', () => {
  db.close()
})
