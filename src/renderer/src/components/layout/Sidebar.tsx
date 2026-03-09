import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    ArrowLeftRight,
    Wallet,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Building2,
    Tag,
    FolderTree,
    Repeat,
    Bell,
    PiggyBank,
    Settings
} from 'lucide-react'

const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { to: '/accounts', label: 'Accounts', icon: Building2 },
    { to: '/budget', label: 'Budget', icon: Wallet },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/categories', label: 'Categories', icon: FolderTree },
    { to: '/tags', label: 'Tags', icon: Tag },
    { to: '/recurring', label: 'Recurring', icon: Repeat },
    { to: '/reminders', label: 'Reminders', icon: Bell },
    { to: '/savings-goals', label: 'Savings Goals', icon: PiggyBank },
    { to: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
    collapsed: boolean
    onToggle: () => void
}

function Sidebar({ collapsed, onToggle }: SidebarProps) {
    return (
        <aside
            className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}
        >
            {/* Logo area */}
            <div className="sidebar__logo">
                <div className="sidebar__logo-icon">
                    <Wallet size={24} />
                </div>
                {!collapsed && <span className="sidebar__logo-text">PR Finance</span>}
            </div>

            {/* Navigation */}
            <nav className="sidebar__nav">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                        }
                        title={collapsed ? label : undefined}
                    >
                        <Icon size={20} className="sidebar__link-icon" />
                        {!collapsed && <span className="sidebar__link-label">{label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Collapse toggle */}
            <button
                className="sidebar__toggle"
                onClick={onToggle}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                {!collapsed && <span className="sidebar__toggle-label">Collapse</span>}
            </button>
        </aside>
    )
}

export default Sidebar
