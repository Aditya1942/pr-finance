function Dashboard() {
    return (
        <div className="page">
            <div className="page__grid">
                {/* Summary Cards */}
                <div className="card card--accent-green">
                    <div className="card__label">Total Income</div>
                    <div className="card__value">₹0.00</div>
                </div>
                <div className="card card--accent-red">
                    <div className="card__label">Total Expenses</div>
                    <div className="card__value">₹0.00</div>
                </div>
                <div className="card card--accent-blue">
                    <div className="card__label">Balance</div>
                    <div className="card__value">₹0.00</div>
                </div>
                <div className="card card--accent-purple">
                    <div className="card__label">Budget Used</div>
                    <div className="card__value">0%</div>
                </div>
            </div>

            <div className="page__section">
                <div className="card">
                    <h2 className="card__title">Recent Transactions</h2>
                    <p className="card__empty">No transactions yet. Add your first transaction to get started.</p>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
