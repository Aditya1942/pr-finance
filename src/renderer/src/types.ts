export interface Category {
    id: number
    name: string
    type: 'income' | 'expense'
    budget_amount: number
    color: string
    created_at: string
    parent_id?: number | null
    icon?: string | null
}

export interface Account {
    id: number
    name: string
    type: 'cash' | 'bank' | 'saving' | 'investment' | 'loan' | 'account_payable' | 'account_receivable' | 'capital'
    initial_balance: number
    created_at: string
}

export interface AccountBalance extends Account {
    balance: number
}

export interface Tag {
    id: number
    name: string
    color: string
    created_at: string
}

export interface Transaction {
    id: number
    date: string
    amount: number
    description: string
    category_id: number
    type: 'income' | 'expense'
    category_name: string
    category_color: string
    tags: Tag[]
    created_at: string
    updated_at: string
    account_id?: number | null
    currency?: string | null
}

export interface DashboardSummary {
    totalIncome: number
    totalExpense: number
    netBalance: number
    savingsRate: number
    monthlyTrends: { month: string; income: number; expense: number }[]
    categoryBreakdown: { name: string; color: string; total: number }[]
    dailyCashFlow: { date: string; net: number }[]
    recentTransactions: Transaction[]
    topCategories: { name: string; color: string; total: number; budget_amount: number }[]
    currentMonth: { income: number; expense: number } | null
}

export interface BudgetItem {
    id: number
    name: string
    color: string
    budget_amount: number
    spent: number
}

export interface ReportData {
    summary: { period: string; income: number; expense: number }[]
    categoryWise: { period: string; category: string; color: string; total: number }[]
    incomeBySource?: { period: string; source: string; color: string; total: number }[]
}

export interface PlReport {
    totalDebit: number
    totalCredit: number
    netPl: number
    netLoss: number
}

export interface BalanceSheetData {
    assets: { id: number; name: string; type: string; balance: number }[]
    liabilities: { id: number; name: string; type: string; balance: number }[]
    totalAssets: number
    totalLiabilities: number
    netWorth: number
}

export interface RecurringTemplate {
    id: number
    description: string
    amount: number
    category_id: number
    category_name: string
    category_color: string
    type: 'income' | 'expense'
    frequency: string
    next_run: string
    end_date: string | null
    is_active: number
    account_id: number | null
    created_at: string
}

export interface Reminder {
    id: number
    title: string
    due_date: string
    amount: number | null
    description: string | null
    recurring_id: number | null
    paid_at: string | null
    created_at: string
}

// Window API type declaration
declare global {
    interface Window {
        api: {
            getCategories: (type?: string) => Promise<Category[]>
            createCategory: (data: { name: string; type: string; color?: string }) => Promise<Category>
            deleteCategory: (id: number) => Promise<{ success: boolean }>
            updateCategoryBudget: (id: number, amount: number) => Promise<{ success: boolean }>
            updateCategory: (id: number, data: { name?: string; type?: string; color?: string; parent_id?: number | null; icon?: string | null }) => Promise<{ success: boolean }>
            getTags: () => Promise<Tag[]>
            createTag: (data: { name: string; color?: string }) => Promise<Tag>
            updateTag: (id: number, data: { name?: string; color?: string }) => Promise<{ success: boolean }>
            deleteTag: (id: number) => Promise<{ success: boolean }>
            getAccounts: () => Promise<Account[]>
            createAccount: (data: { name: string; type: string; initial_balance?: number }) => Promise<{ id: number }>
            updateAccount: (id: number, data: { name?: string; type?: string; initial_balance?: number }) => Promise<{ success: boolean }>
            deleteAccount: (id: number) => Promise<{ success: boolean }>
            getAccountBalances: () => Promise<AccountBalance[]>
            getPlReport: () => Promise<PlReport>
            getBalanceSheet: () => Promise<BalanceSheetData>
            getTransactions: (filters?: {
                type?: string; categoryId?: number; tagId?: number; accountId?: number
                startDate?: string; endDate?: string; search?: string
                limit?: number; offset?: number
            }) => Promise<Transaction[]>
            getTransaction: (id: number) => Promise<Transaction | null>
            createTransaction: (data: {
                date: string; amount: number; description: string
                category_id: number; type: string; tagIds?: number[]; account_id?: number | null; currency?: string
            }) => Promise<{ id: number }>
            updateTransaction: (id: number, data: {
                date: string; amount: number; description: string
                category_id: number; type: string; tagIds?: number[]; account_id?: number | null; currency?: string
            }) => Promise<{ success: boolean }>
            deleteTransaction: (id: number) => Promise<{ success: boolean }>
            bulkDeleteTransactions: (ids: number[]) => Promise<{ deleted: number }>
            bulkUpdateTransactionCategory: (ids: number[], categoryId: number) => Promise<{ updated: number }>
            exportTransactionsToCsv: (filters?: { startDate?: string; endDate?: string }) => Promise<string>
            getDashboardSummary: () => Promise<DashboardSummary>
            getBudgetOverview: () => Promise<BudgetItem[]>
            getReportData: (period: 'monthly' | 'quarterly' | 'yearly') => Promise<ReportData>
            getRecurringTemplates: () => Promise<RecurringTemplate[]>
            createRecurringTemplate: (data: {
                description: string; amount: number; category_id: number; type: string
                frequency: string; next_run: string; end_date?: string | null; account_id?: number | null
            }) => Promise<{ id: number }>
            updateRecurringTemplate: (id: number, data: {
                description?: string; amount?: number; category_id?: number; type?: string
                frequency?: string; next_run?: string; end_date?: string | null; is_active?: number; account_id?: number | null
            }) => Promise<{ success: boolean }>
            deleteRecurringTemplate: (id: number) => Promise<{ success: boolean }>
            getReminders: (options?: { includePaid?: boolean }) => Promise<Reminder[]>
            createReminder: (data: { title: string; due_date: string; amount?: number; description?: string; recurring_id?: number | null }) => Promise<{ id: number }>
            updateReminder: (id: number, data: { title?: string; due_date?: string; amount?: number; description?: string; paid_at?: string | null }) => Promise<{ success: boolean }>
            deleteReminder: (id: number) => Promise<{ success: boolean }>
            markReminderPaid: (id: number) => Promise<{ success: boolean }>
            getExchangeRate: (from: string, to: string) => Promise<{ rate: number; as_of_date: string } | undefined>
            setExchangeRate: (data: { from_currency: string; to_currency: string; rate: number; as_of_date: string }) => Promise<{ success: boolean }>
            getDefaultCurrency: () => Promise<string | null>
            setDefaultCurrency: (currency: string) => Promise<{ success: boolean }>
            getUserDataPath: () => Promise<string>
            showNotification: (opts: { title: string; body?: string }) => Promise<void>
            backupDatabase: () => Promise<{ success: boolean; canceled?: boolean; path?: string }>
            clearDatabase: () => Promise<{ success: boolean }>
            exportToExcel: () => Promise<{ success: boolean; canceled?: boolean; path?: string }>
            getDatabaseStats: () => Promise<{
                fileSize: number
                tables: { name: string; count: number }[]
                path: string
            }>
            platform: string
        }
    }
}
