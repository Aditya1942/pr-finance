# PR Finance – Interview Draft

## User Decisions

1. **App Type**: Personal Finance Tracker
2. **Core Features (MVP)**: Expense Tracking, Income Tracking, Budget Management, Reports & Analytics
3. **Database Structure**: Category-Based (single transactions table, categories determine income/expense type)
4. **UI Layout**: Dashboard + Sidebar Navigation
5. **Setup Approach**: electron-vite template (recommended)
6. **Architecture**: Option 1 – Monolithic SQLite with IPC Bridge
   - Main process: all SQLite operations via better-sqlite3
   - Renderer process: pure React UI via IPC
   - Single SQLite database file in userData directory

## Tech Stack

- Electron (desktop shell)
- React (UI library)
- Vite (bundler, via electron-vite)
- Tailwind CSS (styling)
- better-sqlite3 (SQLite driver, main process)
- React Router (navigation)

## Database Schema

- `categories` table: id, name, type (income/expense), budget_amount, created_at
- `transactions` table: id, date, amount, description, category_id (FK), created_at, updated_at
- Indexes on date, category_id

## IPC Channels

- db:initialize, db:getTransactions, db:createTransaction, db:updateTransaction, db:deleteTransaction
- db:getCategories, db:createCategory
- db:getBudgets, db:createBudget
- db:getSummary

## UI Structure

- Sidebar navigation: Dashboard, Transactions, Budget, Reports
- Dashboard: summary cards, recent transactions, budget overview
- Transactions: filterable list, add/edit modal
- Budget: category budgets with progress bars
- Reports: charts (expense breakdown, income vs expense, category spending)

## Simplicity Constraints (user requested "keep it simple")

- No state management library (local state + IPC is enough)
- No React Query – direct IPC calls with useState/useEffect
- No TypeScript initially – plain JS/JSX
- Minimal dependencies
- Focus on core foundation setup first, then features
