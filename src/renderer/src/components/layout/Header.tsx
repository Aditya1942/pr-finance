import { useState, useEffect } from 'react'
import { Sun, Moon, Settings, Bell } from 'lucide-react'

interface HeaderProps {
    title: string
}

function Header({ title }: HeaderProps) {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('pr-finance-theme')
        return saved === 'dark'
    })

    useEffect(() => {
        const root = document.documentElement
        if (darkMode) {
            root.classList.add('dark')
            localStorage.setItem('pr-finance-theme', 'dark')
        } else {
            root.classList.remove('dark')
            localStorage.setItem('pr-finance-theme', 'light')
        }
    }, [darkMode])

    return (
        <header className="header">
            <div className="header__left">
                <h1 className="header__title">{title}</h1>
            </div>

            <div className="header__right">
                {/* Notification bell */}
                <button className="header__icon-btn" title="Notifications">
                    <Bell size={20} />
                </button>

                {/* Theme toggle */}
                <button
                    className="header__icon-btn header__theme-toggle"
                    onClick={() => setDarkMode(!darkMode)}
                    title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    <div className="header__theme-icon-wrapper">
                        <Sun size={20} className={`header__theme-icon ${darkMode ? 'header__theme-icon--hidden' : ''}`} />
                        <Moon size={20} className={`header__theme-icon ${!darkMode ? 'header__theme-icon--hidden' : ''}`} />
                    </div>
                </button>

                {/* Settings */}
                <button className="header__icon-btn" title="Settings">
                    <Settings size={20} />
                </button>
            </div>
        </header>
    )
}

export default Header
