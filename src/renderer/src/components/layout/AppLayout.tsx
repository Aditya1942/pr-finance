import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const ROUTE_TITLES: Record<string, string> = {
    '/': 'Dashboard',
    '/transactions': 'Transactions',
    '/accounts': 'Accounts',
    '/budget': 'Budget',
    '/reports': 'Reports',
    '/categories': 'Categories',
    '/tags': 'Tags',
    '/recurring': 'Recurring',
    '/reminders': 'Reminders',
    '/settings': 'Settings',
}

const SHORTCUTS: { key: string; path: string }[] = [
    { key: '1', path: '/' },
    { key: '2', path: '/transactions' },
    { key: '3', path: '/accounts' },
    { key: '4', path: '/budget' },
    { key: '5', path: '/reports' },
    { key: '6', path: '/categories' },
    { key: '7', path: '/tags' },
    { key: '8', path: '/recurring' },
    { key: '9', path: '/reminders' },
    { key: '0', path: '/settings' },
]

function AppLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()

    const basePath = location.pathname.split('/').filter(Boolean)[0] || ''
    const title = ROUTE_TITLES['/' + basePath] || ROUTE_TITLES[location.pathname] || 'PR Finance'

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!e.metaKey && !e.ctrlKey) return
            const num = SHORTCUTS.find(s => s.key === e.key)
            if (num) {
                e.preventDefault()
                navigate(num.path)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [navigate])

    return (
        <div className={`app-layout ${sidebarCollapsed ? 'app-layout--collapsed' : ''}`}>
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className="app-layout__main">
                <Header title={title} />
                <main className="app-layout__content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default AppLayout
