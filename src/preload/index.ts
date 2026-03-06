import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Categories
  getCategories: (type?: string) => ipcRenderer.invoke('db:getCategories', type),
  createCategory: (data: { name: string; type: string; color?: string }) =>
    ipcRenderer.invoke('db:createCategory', data),
  deleteCategory: (id: number) => ipcRenderer.invoke('db:deleteCategory', id),
  updateCategoryBudget: (id: number, amount: number) =>
    ipcRenderer.invoke('db:updateCategoryBudget', id, amount),
  updateCategory: (id: number, data: { name?: string; type?: string; color?: string; parent_id?: number | null; icon?: string | null }) =>
    ipcRenderer.invoke('db:updateCategory', id, data),

  // Tags
  getTags: () => ipcRenderer.invoke('db:getTags'),
  createTag: (data: { name: string; color?: string }) =>
    ipcRenderer.invoke('db:createTag', data),
  updateTag: (id: number, data: { name?: string; color?: string }) =>
    ipcRenderer.invoke('db:updateTag', id, data),
  deleteTag: (id: number) => ipcRenderer.invoke('db:deleteTag', id),

  // Accounts
  getAccounts: () => ipcRenderer.invoke('db:getAccounts'),
  createAccount: (data: { name: string; type: string; initial_balance?: number }) =>
    ipcRenderer.invoke('db:createAccount', data),
  updateAccount: (id: number, data: { name?: string; type?: string; initial_balance?: number }) =>
    ipcRenderer.invoke('db:updateAccount', id, data),
  deleteAccount: (id: number) => ipcRenderer.invoke('db:deleteAccount', id),
  getAccountBalances: () => ipcRenderer.invoke('db:getAccountBalances'),
  getPlReport: () => ipcRenderer.invoke('db:getPlReport'),
  getBalanceSheet: () => ipcRenderer.invoke('db:getBalanceSheet'),

  // Transactions
  getTransactions: (filters?: {
    type?: string; categoryId?: number; tagId?: number; accountId?: number;
    startDate?: string; endDate?: string; search?: string;
    limit?: number; offset?: number
  }) => ipcRenderer.invoke('db:getTransactions', filters),
  getTransaction: (id: number) => ipcRenderer.invoke('db:getTransaction', id),
  createTransaction: (data: {
    date: string; amount: number; description: string;
    category_id: number; type: string; tagIds?: number[]; account_id?: number | null; currency?: string
  }) => ipcRenderer.invoke('db:createTransaction', data),
  updateTransaction: (id: number, data: {
    date: string; amount: number; description: string;
    category_id: number; type: string; tagIds?: number[]; account_id?: number | null; currency?: string
  }) => ipcRenderer.invoke('db:updateTransaction', id, data),
  deleteTransaction: (id: number) => ipcRenderer.invoke('db:deleteTransaction', id),
  bulkDeleteTransactions: (ids: number[]) => ipcRenderer.invoke('db:bulkDeleteTransactions', ids),
  bulkUpdateTransactionCategory: (ids: number[], categoryId: number) =>
    ipcRenderer.invoke('db:bulkUpdateTransactionCategory', ids, categoryId),
  exportTransactionsToCsv: (filters?: { startDate?: string; endDate?: string }) =>
    ipcRenderer.invoke('db:exportTransactionsToCsv', filters),

  // Dashboard
  getDashboardSummary: () => ipcRenderer.invoke('db:getDashboardSummary'),

  // Budget
  getBudgetOverview: () => ipcRenderer.invoke('db:getBudgetOverview'),

  // Reports
  getReportData: (period: 'monthly' | 'quarterly' | 'yearly') =>
    ipcRenderer.invoke('db:getReportData', period),

  // Recurring
  getRecurringTemplates: () => ipcRenderer.invoke('db:getRecurringTemplates'),
  createRecurringTemplate: (data: {
    description: string; amount: number; category_id: number; type: string;
    frequency: string; next_run: string; end_date?: string | null; account_id?: number | null
  }) => ipcRenderer.invoke('db:createRecurringTemplate', data),
  updateRecurringTemplate: (id: number, data: {
    description?: string; amount?: number; category_id?: number; type?: string;
    frequency?: string; next_run?: string; end_date?: string | null; is_active?: number; account_id?: number | null
  }) => ipcRenderer.invoke('db:updateRecurringTemplate', id, data),
  deleteRecurringTemplate: (id: number) => ipcRenderer.invoke('db:deleteRecurringTemplate', id),

  // Reminders
  getReminders: (options?: { includePaid?: boolean }) => ipcRenderer.invoke('db:getReminders', options),
  createReminder: (data: { title: string; due_date: string; amount?: number; description?: string; recurring_id?: number | null }) =>
    ipcRenderer.invoke('db:createReminder', data),
  updateReminder: (id: number, data: { title?: string; due_date?: string; amount?: number; description?: string; paid_at?: string | null }) =>
    ipcRenderer.invoke('db:updateReminder', id, data),
  deleteReminder: (id: number) => ipcRenderer.invoke('db:deleteReminder', id),
  markReminderPaid: (id: number) => ipcRenderer.invoke('db:markReminderPaid', id),

  // Exchange rates
  getExchangeRate: (from: string, to: string) => ipcRenderer.invoke('db:getExchangeRate', from, to),
  setExchangeRate: (data: { from_currency: string; to_currency: string; rate: number; as_of_date: string }) =>
    ipcRenderer.invoke('db:setExchangeRate', data),

  // Preferences
  getDefaultCurrency: () => ipcRenderer.invoke('prefs:get', 'default_currency'),
  setDefaultCurrency: (currency: string) => ipcRenderer.invoke('prefs:set', 'default_currency', currency),

  // App
  getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath'),
  showNotification: (opts: { title: string; body?: string }) => ipcRenderer.invoke('app:showNotification', opts),

  // Database Management
  backupDatabase: () => ipcRenderer.invoke('db:backupDatabase'),
  clearDatabase: () => ipcRenderer.invoke('db:clearDatabase'),
  exportToExcel: () => ipcRenderer.invoke('db:exportToExcel'),
  getDatabaseStats: () => ipcRenderer.invoke('db:getDatabaseStats'),

  // Platform
  platform: process.platform,
})
