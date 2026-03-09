import { HashRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import TransactionDetail from './pages/TransactionDetail'
import Accounts from './pages/Accounts'
import Budget from './pages/Budget'
import Reports from './pages/Reports'
import Categories from './pages/Categories'
import Tags from './pages/Tags'
import Recurring from './pages/Recurring'
import Reminders from './pages/Reminders'
import SavingsGoals from './pages/SavingsGoals'
import Settings from './pages/Settings'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/:id" element={<TransactionDetail />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/savings-goals" element={<SavingsGoals />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
