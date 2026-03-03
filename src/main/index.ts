import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import Database from 'better-sqlite3'

let db: InstanceType<typeof Database>

function initDatabase() {
  db = new Database(path.join(app.getPath('userData'), 'finance.db'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      budget_amount REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      category_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  `)
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  return mainWindow
}

app.whenReady().then(() => {
  initDatabase()
  createWindow()

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
