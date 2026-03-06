# PR Finance — Personal Finance Tracker (Single User)

> **Architecture:** Single-user Electron desktop app. No authentication or multi-user support needed — data is isolated per OS user via SQLite stored at `~/.config/pr-finance/`.

---

## Legacy alignment (from Finance.xlsx)

Business logic derived from the legacy Excel workbook — implement so the app can replicate and replace it.

- **Ledger (P&L):** Main ledger = Debit (expenses) + Credit (income). Totals: Total Dr, Total Cr, **Net P&L** (Net Loss when Dr > Cr). Must match Balance Sheet “Net Loss” / equity.
- **Balance Sheet:** Liabilities (Loans, Capital, Net Loss, Account Payable e.g. Sima Didi, Manish Bhai) = Assets (Cash, Bank, Savings, Investment, Account Receivable). Total Assets = Total Liabilities; support named payables/receivables.
- **Bank & cash snapshot:** Single view of all accounts with current balances and total (e.g. Lloyd’s, Father’s Account, Dream, Cash) — align with existing account list/balances.
- **Income vs expense by period:** By month/year and by category or source (e.g. “Living Expense”, “Suji Wages”) — pivot-style; align with Reports period + category tables.
- **Pre-UK / India phase (INR):** Separate phase or currency: income (e.g. loan disbursed, money from Hitesh), expenses (IELTS, visa, SHU, flight, etc.) in **INR**. Either multi-currency transactions with currency=INR + phase tag, or a dedicated “Pre-UK” ledger/section.
- **Currency:** One reference rate (e.g. **GBP/INR**) with optional “as of” date; used for conversion and for displaying INR amounts in GBP (or vice versa). Sheet1 note: “GBP 1 = 107.59 INR (05 Dec)”; Data sheet has “live” rate.
- **Account types (legacy):** Cash, Bank, Saving, Investment, **Loan**, **Account Payable**, **Account Receivable**, Capital — ensure schema and UI support these where applicable (e.g. loans, payables, receivables as account types).
- **Analyse:** Legacy “Analyse” sheet = charts/formulas; in app = **Reports / Analysis** built from transactions and summaries (already in scope).

---

## Phase 1: Core Foundation (COMPLETED)
- [x] Electron + React + Vite project setup
- [x] Tailwind CSS integration
- [x] SQLite database with better-sqlite3
- [x] Full database schema (accounts, transactions, categories, tags, budgets, recurring, reminders)
- [x] Default categories seeded (17 categories: 12 expense, 5 income)
- [x] Migration system for schema versioning
- [x] IPC bridge (main ↔ renderer) via preload
- [x] App builds and runs successfully

## Phase 2: Account Management (COMPLETED)
- [x] Add/Edit/Delete accounts (bank, cash, credit card, savings, investment)
- [x] Account list page with balances
- [x] Account detail view showing transaction history
- [x] Transfer between accounts
- [x] Account balance auto-calculation from transactions
- [x] **Legacy:** Support account types: Loan, Account Payable, Account Receivable (for balance sheet parity)
- [ ] **Legacy:** “Bank & cash” snapshot view (all accounts + total) if not already covered by account list

## Phase 3: Transaction Management (COMPLETED)
- [x] Add income/expense transaction form (amount, category, date, description)
- [x] Transaction list with search, filter by type/category/tag
- [x] Edit and delete transactions
- [x] Delete confirmation dialog
- [x] Tag creation inline during transaction add/edit
- [x] Auto-update account balance on transaction CRUD
- [x] Transaction detail view (dedicated page)
- [x] Bulk actions (delete multiple, re-categorize)
- [x] **Legacy:** P&L view or report: Total Debit (expenses), Total Credit (income), Net P&L (Net Loss when expenses > income) — align with balance sheet “Net Loss”

## Phase 4: Categories & Tags (COMPLETED)
- [x] Default categories with color support (17 seeded)
- [x] Tag creation from transaction form (with auto color assignment)
- [x] Filter transactions by tag
- [x] Category-wise spending shown in Dashboard & Reports
- [x] `updateCategoryBudget` IPC for setting per-category budget amounts
- [x] Dedicated category management page (add/edit/delete custom categories)
- [x] Sub-categories support (parent_id)
- [x] Icon picker for categories (color picker)
- [x] Dedicated tag management page

## Phase 5: Dashboard & Charts (COMPLETED)
- [x] Summary cards — Total Income, Total Expenses, Net Balance, Savings Rate (animated counters)
- [x] Monthly Income vs Expense — custom SVG Bar Chart (last 6 months)
- [x] Category expense breakdown — custom SVG Donut Chart with legend
- [x] Daily cash flow — custom SVG SparkLine (last 30 days)
- [x] Recent transactions list on dashboard
- [x] Top spending categories leaderboard (animated progress bars)
- [x] Balance sheet panel (assets vs liabilities, net worth)
- [x] Loading skeleton states
- [x] **Legacy:** Balance sheet parity — Total Liabilities = Total Assets; support Capital, Net Loss in equity; named Account Payable / Account Receivable

## Phase 6: Budget Management (COMPLETED)
- [x] Set monthly budget per category (inline edit on budget card)
- [x] Budget vs actual spending progress bars (animated)
- [x] Budget overview dashboard with summary strip (Total Budget, Total Spent, Over-budget count)
- [x] Over-budget alerts/warnings (red progress bar + AlertTriangle icon)
- [ ] Budget history (compare month-over-month)
- [ ] Separate budget periods (currently uses category budget_amount as static figure)

## Phase 7: Reports (COMPLETED)
- [x] Income vs Expense bar chart by period
- [x] Period selector (Monthly / Quarterly / Yearly)
- [x] Period summary table (income, expenses, savings, savings rate)
- [x] Category-wise expenses table (cross-tab by period)
- [x] Balance sheet view in reports (by period)
- [x] **Legacy:** Income by source and expense by category pivot-style views (by month) — align with Data sheet
- [x] Export transactions to CSV
- [ ] Monthly/yearly PDF reports
- [x] Print-friendly report view

## Phase 8: Recurring Transactions (COMPLETED)
- [x] Create recurring transaction templates (daily/weekly/monthly/yearly)
- [x] Auto-generate transactions on due date
- [x] Manage active/paused recurring transactions
- [x] Edit frequency, amount, end date
- [x] Upcoming recurring transactions preview

## Phase 9: Bill Reminders & Notifications (COMPLETED)
- [x] Add bill reminders with due dates
- [ ] Link reminders to recurring transactions
- [x] System notifications for upcoming bills (Electron notifications)
- [x] Mark bills as paid
- [x] Overdue bill highlighting

## Phase 9b: Multi-currency & Pre-UK / India phase (Legacy) (PARTIAL)
- [x] Multi-currency support: primary GBP; optional INR (schema + Settings GBP/INR rate)
- [ ] Pre-UK / India phase: income and expenses in INR (e.g. loan disbursed, Hitesh, IELTS, visa, SHU, flight) — either currency=INR on transactions + phase tag, or dedicated “Pre-UK” section/ledger
- [ ] Show Pre-UK totals and summary (e.g. “Total amount should have”, “Total after paying debt”) when data exists

## Phase 10: UI/UX Polish (PARTIAL)
- [x] Sidebar navigation with icons and active state highlighting
- [x] Dark/Light theme toggle (in Header)
- [x] React Router for page navigation (HashRouter)
- [x] Custom CSS design system (index.css — tokens, typography, layout, components)
- [x] Chart components: BarChart, DonutChart, SparkLine, AnimatedCounter
- [ ] Keyboard shortcuts
- [ ] Settings page (currency, date format, backup location, app preferences)
- [ ] **Legacy:** Currency — GBP/INR reference rate with “as of” date; use for conversion and display (e.g. show INR in GBP)
- [ ] Data backup & restore (SQLite file export/import)
- [ ] App icon and splash screen
- [ ] Collapsible sidebar

## Tech Debt & Improvements
- [ ] Error boundary components
- [ ] Loading skeletons for async data (dashboard has skeleton, others are basic)
- [ ] Input validation on all forms
- [ ] Unit tests for database operations
- [ ] E2E tests with Playwright
- [ ] Pagination for transaction list (currently loads all)
- [x] Account-level filtering in transactions
