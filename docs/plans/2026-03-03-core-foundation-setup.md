# PR Finance Core Foundation Setup – Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up a working Electron + React + Vite desktop app with Tailwind CSS and SQLite database, ready for feature development.

**Architecture:** Electron main process handles all SQLite operations via better-sqlite3 and exposes them through IPC handlers. Renderer process is a React app with Tailwind CSS that communicates via contextBridge-exposed API. electron-vite manages the build for all three entry points (main, preload, renderer).

**Tech Stack:** electron-vite (scaffolding), React (UI), Tailwind CSS v4 (styling), better-sqlite3 (SQLite), React Router (navigation)

**Scope:** Foundation ONLY — scaffolding, Tailwind, SQLite database with schema, IPC bridge, basic navigation shell. NO feature implementation (no transaction forms, no budget UI, no charts).

---

## Task 1: Scaffold electron-vite project

**What to do:**
The current repo has only `.gitignore`, `README.md`, and `.git/`. We need to scaffold an electron-vite React project. Since `create @quick-start/electron` creates a new directory, we'll scaffold into a temp directory and move files into the repo root, overriding existing files.

**Files:**
- Override: `package.json`, `.gitignore`, `README.md`
- Create: `electron.vite.config.mjs`, `src/main/index.js`, `src/preload/index.js`, `src/renderer/index.html`, `src/renderer/src/main.jsx`, `src/renderer/src/App.jsx`, `src/renderer/src/assets/`

**Step 1: Scaffold into temp directory**

```bash
cd /Users/aditya/Documents
npm create @quick-start/electron@latest pr-finance-temp -- --template react --skip-git
```

If the CLI asks interactive questions, select:
- Framework: React
- TypeScript: No
- Electron updater plugin: No

**Step 2: Move scaffolded files into repo root**

```bash
# Move everything from temp into the repo, overriding existing files
cp -r /Users/aditya/Documents/pr-finance-temp/* /Users/aditya/Documents/pr-finance/
cp -r /Users/aditya/Documents/pr-finance-temp/.* /Users/aditya/Documents/pr-finance/ 2>/dev/null || true

# Remove temp directory
rm -rf /Users/aditya/Documents/pr-finance-temp
```

**Step 3: Merge .gitignore**

The electron-vite template generates its own `.gitignore`. Merge it with the existing one, keeping both sets of rules. Also add these entries:
```
# SQLite database files
*.db
*.db-journal
*.db-wal
```

**Step 4: Install dependencies**

```bash
cd /Users/aditya/Documents/pr-finance
npm install
```

**Step 5: Verify the app runs**

```bash
cd /Users/aditya/Documents/pr-finance
npm run dev
```

Expected: Electron window opens showing the default React template page. Close the app after confirming.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold electron-vite project with React template"
```

---

## Task 2: Integrate Tailwind CSS v4

**What to do:**
Install Tailwind CSS v4 with the Vite plugin and configure it for the renderer process.

**Files:**
- Modify: `electron.vite.config.mjs` (add tailwindcss plugin to renderer)
- Modify: `src/renderer/src/assets/main.css` (replace contents with Tailwind import)
- Modify: `src/renderer/src/App.jsx` (add a test element with Tailwind classes)

**Step 1: Install Tailwind CSS v4 packages**

```bash
cd /Users/aditya/Documents/pr-finance
npm install tailwindcss @tailwindcss/vite
```

**Step 2: Add Tailwind plugin to electron.vite.config.mjs**

Open `electron.vite.config.mjs` and add the `@tailwindcss/vite` plugin to the `renderer.plugins` array:

```javascript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
```

**Step 3: Replace CSS file with Tailwind import**

Replace the entire contents of `src/renderer/src/assets/main.css` with:

```css
@import "tailwindcss";
```

**Step 4: Update App.jsx to verify Tailwind works**

Replace `src/renderer/src/App.jsx` with a simple test:

```jsx
function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">PR Finance</h1>
        <p className="text-gray-400">Tailwind CSS is working!</p>
      </div>
    </div>
  )
}

export default App
```

**Step 5: Verify Tailwind works**

```bash
npm run dev
```

Expected: Electron window shows "PR Finance" centered on a dark background with styled text. If you see unstyled text, Tailwind is not configured correctly.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: integrate Tailwind CSS v4 with electron-vite"
```

---

## Task 3: Set up better-sqlite3 with native module rebuild

**What to do:**
Install better-sqlite3, configure it as an external dependency for electron-vite, rebuild the native module for Electron, and verify it works.

**Files:**
- Modify: `package.json` (add rebuild script)
- Modify: `electron.vite.config.mjs` (externalize better-sqlite3 if needed)
- Create: `src/main/database.js` (database module)

**Step 1: Install better-sqlite3 and rebuild tools**

```bash
cd /Users/aditya/Documents/pr-finance
npm install better-sqlite3
npm install --save-dev electron-rebuild
```

**Step 2: Add rebuild script to package.json**

Add to `package.json` scripts:

```json
"rebuild": "electron-rebuild -f -w better-sqlite3",
"postinstall": "electron-rebuild -f -w better-sqlite3"
```

**Step 3: Run the native module rebuild**

```bash
npx electron-rebuild -f -w better-sqlite3
```

Expected: Output shows successful compilation of better-sqlite3 for Electron's Node ABI.

**Step 4: Ensure better-sqlite3 is externalized**

The `externalizeDepsPlugin()` in `electron.vite.config.mjs` already externalizes all `node_modules` for the main process. Verify this is present in the main config (it should be from Task 1). No changes needed if `externalizeDepsPlugin()` is already in main.plugins.

**Step 5: Create the database module**

Create `src/main/database.js`:

```javascript
import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db = null

export function getDatabase() {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbDir = path.join(userDataPath, 'data')
  const dbPath = path.join(dbDir, 'pr-finance.db')

  // Ensure the data directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  db = new Database(dbPath)

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL')
  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  return db
}

export function initializeDatabase() {
  const db = getDatabase()

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      budget_amount REAL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL CHECK(amount > 0),
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  `)

  // Seed default categories if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM categories').get()
  if (count.count === 0) {
    const insert = db.prepare('INSERT INTO categories (name, type, budget_amount) VALUES (?, ?, ?)')
    const seedCategories = db.transaction((categories) => {
      for (const cat of categories) {
        insert.run(cat.name, cat.type, cat.budget_amount)
      }
    })

    seedCategories([
      { name: 'Salary', type: 'income', budget_amount: 0 },
      { name: 'Freelance', type: 'income', budget_amount: 0 },
      { name: 'Food & Dining', type: 'expense', budget_amount: 0 },
      { name: 'Transportation', type: 'expense', budget_amount: 0 },
      { name: 'Housing', type: 'expense', budget_amount: 0 },
      { name: 'Utilities', type: 'expense', budget_amount: 0 },
      { name: 'Entertainment', type: 'expense', budget_amount: 0 },
      { name: 'Shopping', type: 'expense', budget_amount: 0 },
      { name: 'Healthcare', type: 'expense', budget_amount: 0 },
      { name: 'Other Income', type: 'income', budget_amount: 0 },
      { name: 'Other Expense', type: 'expense', budget_amount: 0 }
    ])
  }

  return db
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
```

**Step 6: Verify database initializes on app start**

Add to `src/main/index.js`, import and call `initializeDatabase()` inside `app.whenReady()`:

```javascript
import { initializeDatabase, closeDatabase } from './database'

// Inside app.whenReady():
initializeDatabase()

// Add before app quits:
app.on('before-quit', () => {
  closeDatabase()
})
```

**Step 7: Verify app starts without errors**

```bash
npm run dev
```

Expected: App opens without errors. Check the terminal for any SQLite-related errors. The database file should be created at `<userData>/data/pr-finance.db`.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: set up better-sqlite3 with schema and seed data"
```

---

## Task 4: Set up IPC bridge (preload + main handlers)

**What to do:**
Create the IPC communication layer. Main process registers handlers for database operations. Preload script exposes a typed API to the renderer via contextBridge.

**Files:**
- Create: `src/main/ipc-handlers.js` (all IPC handlers)
- Modify: `src/main/index.js` (register IPC handlers)
- Modify: `src/preload/index.js` (expose electronAPI via contextBridge)

**Step 1: Create IPC handlers**

Create `src/main/ipc-handlers.js`:

```javascript
import { ipcMain } from 'electron'
import { getDatabase } from './database'

export function registerIpcHandlers() {
  // --- Categories ---

  ipcMain.handle('db:getCategories', () => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM categories ORDER BY type, name').all()
  })

  ipcMain.handle('db:createCategory', (_event, { name, type, budgetAmount }) => {
    const db = getDatabase()
    const result = db.prepare(
      'INSERT INTO categories (name, type, budget_amount) VALUES (?, ?, ?)'
    ).run(name, type, budgetAmount || 0)
    return { id: result.lastInsertRowid, name, type, budget_amount: budgetAmount || 0 }
  })

  // --- Transactions ---

  ipcMain.handle('db:getTransactions', (_event, filters = {}) => {
    const db = getDatabase()
    let query = `
      SELECT t.*, c.name as category_name, c.type as category_type
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `
    const params = []

    if (filters.startDate) {
      query += ' AND t.date >= ?'
      params.push(filters.startDate)
    }
    if (filters.endDate) {
      query += ' AND t.date <= ?'
      params.push(filters.endDate)
    }
    if (filters.categoryId) {
      query += ' AND t.category_id = ?'
      params.push(filters.categoryId)
    }
    if (filters.type) {
      query += ' AND c.type = ?'
      params.push(filters.type)
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC'

    if (filters.limit) {
      query += ' LIMIT ?'
      params.push(filters.limit)
    }

    return db.prepare(query).all(...params)
  })

  ipcMain.handle('db:createTransaction', (_event, { amount, description, date, categoryId }) => {
    const db = getDatabase()
    const result = db.prepare(
      'INSERT INTO transactions (amount, description, date, category_id) VALUES (?, ?, ?, ?)'
    ).run(amount, description, date, categoryId)
    return db.prepare(`
      SELECT t.*, c.name as category_name, c.type as category_type
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid)
  })

  ipcMain.handle('db:updateTransaction', (_event, { id, amount, description, date, categoryId }) => {
    const db = getDatabase()
    db.prepare(
      `UPDATE transactions
       SET amount = ?, description = ?, date = ?, category_id = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(amount, description, date, categoryId, id)
    return db.prepare(`
      SELECT t.*, c.name as category_name, c.type as category_type
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(id)
  })

  ipcMain.handle('db:deleteTransaction', (_event, { id }) => {
    const db = getDatabase()
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
    return { success: true }
  })

  // --- Summary ---

  ipcMain.handle('db:getSummary', (_event, { startDate, endDate } = {}) => {
    const db = getDatabase()
    let query = `
      SELECT
        COALESCE(SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END), 0) as totalIncome,
        COALESCE(SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END), 0) as totalExpenses
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `
    const params = []

    if (startDate) {
      query += ' AND t.date >= ?'
      params.push(startDate)
    }
    if (endDate) {
      query += ' AND t.date <= ?'
      params.push(endDate)
    }

    const result = db.prepare(query).get(...params)
    return {
      totalIncome: result.totalIncome,
      totalExpenses: result.totalExpenses,
      balance: result.totalIncome - result.totalExpenses
    }
  })

  // --- Budgets ---

  ipcMain.handle('db:getBudgets', () => {
    const db = getDatabase()
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    return db.prepare(`
      SELECT
        c.id, c.name, c.type, c.budget_amount,
        COALESCE(SUM(t.amount), 0) as spent
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id
        AND t.date LIKE ? || '%'
      WHERE c.type = 'expense' AND c.budget_amount > 0
      GROUP BY c.id
      ORDER BY c.name
    `).all(currentMonth)
  })

  ipcMain.handle('db:updateBudget', (_event, { categoryId, budgetAmount }) => {
    const db = getDatabase()
    db.prepare('UPDATE categories SET budget_amount = ? WHERE id = ?').run(budgetAmount, categoryId)
    return { success: true }
  })
}
```

**Step 2: Register handlers in main process**

Modify `src/main/index.js` — add import and call `registerIpcHandlers()` inside `app.whenReady()`:

```javascript
import { registerIpcHandlers } from './ipc-handlers'

// Inside app.whenReady(), after initializeDatabase():
registerIpcHandlers()
```

**Step 3: Set up preload script**

Replace `src/preload/index.js` with:

```javascript
import { contextBridge, ipcRenderer } from 'electron/renderer'

const electronAPI = {
  // Categories
  getCategories: () => ipcRenderer.invoke('db:getCategories'),
  createCategory: (data) => ipcRenderer.invoke('db:createCategory', data),

  // Transactions
  getTransactions: (filters) => ipcRenderer.invoke('db:getTransactions', filters),
  createTransaction: (data) => ipcRenderer.invoke('db:createTransaction', data),
  updateTransaction: (data) => ipcRenderer.invoke('db:updateTransaction', data),
  deleteTransaction: (data) => ipcRenderer.invoke('db:deleteTransaction', data),

  // Summary
  getSummary: (params) => ipcRenderer.invoke('db:getSummary', params),

  // Budgets
  getBudgets: () => ipcRenderer.invoke('db:getBudgets'),
  updateBudget: (data) => ipcRenderer.invoke('db:updateBudget', data)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
```

**Step 4: Verify IPC works**

Update `src/renderer/src/App.jsx` to test an IPC call:

```jsx
import { useState, useEffect } from 'react'

function App() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    window.electronAPI.getCategories().then(setCategories)
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">PR Finance</h1>
      <p className="text-gray-400 mb-4">Categories loaded: {categories.length}</p>
      <ul className="space-y-1">
        {categories.map((c) => (
          <li key={c.id} className="text-sm text-gray-300">
            {c.name} ({c.type})
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
```

**Step 5: Run and verify**

```bash
npm run dev
```

Expected: App shows "PR Finance", "Categories loaded: 11", and lists all seed categories. This confirms database, IPC, and preload are all working.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: set up IPC bridge with database handlers and preload API"
```

---

## Task 5: Set up React Router with navigation shell

**What to do:**
Install React Router and create the sidebar + main content layout with placeholder pages for Dashboard, Transactions, Budget, and Reports.

**Files:**
- Modify: `package.json` (add react-router-dom)
- Create: `src/renderer/src/components/Layout.jsx`
- Create: `src/renderer/src/components/Sidebar.jsx`
- Create: `src/renderer/src/pages/Dashboard.jsx`
- Create: `src/renderer/src/pages/Transactions.jsx`
- Create: `src/renderer/src/pages/Budget.jsx`
- Create: `src/renderer/src/pages/Reports.jsx`
- Modify: `src/renderer/src/App.jsx` (add router and layout)
- Modify: `src/renderer/src/main.jsx` (wrap with BrowserRouter)

**Step 1: Install React Router**

```bash
npm install react-router-dom
```

**Step 2: Create Sidebar component**

Create `src/renderer/src/components/Sidebar.jsx`:

```jsx
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/transactions', label: 'Transactions', icon: '💳' },
  { to: '/budget', label: 'Budget', icon: '🎯' },
  { to: '/reports', label: 'Reports', icon: '📈' }
]

function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white">PR Finance</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
```

**Step 3: Create Layout component**

Create `src/renderer/src/components/Layout.jsx`:

```jsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

function Layout() {
  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
```

**Step 4: Create placeholder pages**

Create `src/renderer/src/pages/Dashboard.jsx`:

```jsx
function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <p className="text-gray-400">Summary cards, recent transactions, and budget overview will go here.</p>
    </div>
  )
}

export default Dashboard
```

Create `src/renderer/src/pages/Transactions.jsx`:

```jsx
function Transactions() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Transactions</h2>
      <p className="text-gray-400">Transaction list with filters and add/edit forms will go here.</p>
    </div>
  )
}

export default Transactions
```

Create `src/renderer/src/pages/Budget.jsx`:

```jsx
function Budget() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Budget</h2>
      <p className="text-gray-400">Budget management with category spending progress will go here.</p>
    </div>
  )
}

export default Budget
```

Create `src/renderer/src/pages/Reports.jsx`:

```jsx
function Reports() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Reports</h2>
      <p className="text-gray-400">Charts and analytics will go here.</p>
    </div>
  )
}

export default Reports
```

**Step 5: Update App.jsx with router**

Replace `src/renderer/src/App.jsx`:

```jsx
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budget from './pages/Budget'
import Reports from './pages/Reports'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budget" element={<Budget />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}

export default App
```

**Step 6: Wrap main.jsx with BrowserRouter**

Modify `src/renderer/src/main.jsx`:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './assets/main.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
```

**Important:** Use `HashRouter` (not `BrowserRouter`) because Electron uses `file://` protocol in production. `BrowserRouter` won't work with file-based routing.

**Step 7: Verify navigation works**

```bash
npm run dev
```

Expected: App shows sidebar on the left with 4 navigation links. Clicking each link shows the corresponding placeholder page. Active link is highlighted.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add React Router with sidebar navigation and placeholder pages"
```

---

## Task 6: Verify full foundation and update README

**What to do:**
Run the full app one more time, verify everything works end-to-end, and update the README with project setup instructions.

**Files:**
- Modify: `README.md`

**Step 1: Full verification**

```bash
npm run dev
```

Verify:
1. App window opens without errors
2. Sidebar navigation works (all 4 pages)
3. No console errors in DevTools (Ctrl+Shift+I / Cmd+Option+I)
4. Tailwind styles render correctly (dark background, styled text)
5. Database file exists at `<userData>/data/pr-finance.db`

**Step 2: Verify build works**

```bash
npm run build
```

Expected: Build completes without errors. Output in `out/` directory.

**Step 3: Update README.md**

Replace `README.md` with:

```markdown
# PR Finance

Personal finance tracker desktop application.

## Tech Stack

- **Electron** — Desktop shell
- **React** — UI library
- **Vite** — Bundler (via electron-vite)
- **Tailwind CSS v4** — Styling
- **better-sqlite3** — SQLite database
- **React Router** — Navigation

## Getting Started

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

## Project Structure

```
src/
├── main/                  # Electron main process
│   ├── index.js           # App entry point, window creation
│   ├── database.js        # SQLite database initialization and connection
│   └── ipc-handlers.js    # IPC handlers for database operations
├── preload/               # Preload scripts
│   └── index.js           # contextBridge API exposed to renderer
└── renderer/              # React application
    └── src/
        ├── main.jsx       # React entry point
        ├── App.jsx        # Router setup
        ├── components/    # Shared components
        │   ├── Layout.jsx
        │   └── Sidebar.jsx
        └── pages/         # Page components
            ├── Dashboard.jsx
            ├── Transactions.jsx
            ├── Budget.jsx
            └── Reports.jsx
```

## Database

SQLite database is stored at `<userData>/data/pr-finance.db` with tables:
- `categories` — Income and expense categories with optional budget amounts
- `transactions` — Financial transactions linked to categories

## IPC API

Available via `window.electronAPI` in the renderer process:
- `getCategories()` / `createCategory(data)`
- `getTransactions(filters)` / `createTransaction(data)` / `updateTransaction(data)` / `deleteTransaction(data)`
- `getSummary(params)`
- `getBudgets()` / `updateBudget(data)`
```

**Step 4: Commit**

```bash
git add -A
git commit -m "docs: update README with project setup and structure"
```

---

## Summary

| Task | Description | Files Changed |
|------|-------------|---------------|
| 1 | Scaffold electron-vite project | ~15 files (template) |
| 2 | Integrate Tailwind CSS v4 | 3 files |
| 3 | Set up better-sqlite3 with schema | 3 files |
| 4 | Set up IPC bridge | 3 files |
| 5 | React Router + navigation shell | 8 files |
| 6 | Verify + update README | 1 file |

**Total estimated time:** 30-45 minutes

**After this foundation is done**, the app will be ready for feature implementation:
- Feature 1: Expense/Income tracking (transaction forms, list, filters)
- Feature 2: Budget management (budget setting, progress tracking)
- Feature 3: Dashboard (summary cards, recent transactions)
- Feature 4: Reports & Analytics (charts, spending breakdowns)
