import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

function AppLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    return (
        <div className={`app-layout ${sidebarCollapsed ? 'app-layout--collapsed' : ''}`}>
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className="app-layout__main">
                <Header title="Dashboard" />
                <main className="app-layout__content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default AppLayout
