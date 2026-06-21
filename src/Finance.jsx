import { useState, useEffect } from 'react';
import { transactions as txApi } from './api';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

const CATS = [
    { key: 'salary', label: 'Salary', icon: '◐' },
    { key: 'food', label: 'Food', icon: '◉' },
    { key: 'transport', label: 'Transport', icon: '◊' },
    { key: 'shopping', label: 'Shopping', icon: '◈' },
    { key: 'bills', label: 'Bills', icon: '◍' },
    { key: 'entertainment', label: 'Entertainment', icon: '◯' },
    { key: 'health', label: 'Health', icon: '◑' },
    { key: 'other', label: 'Other', icon: '○' },
];

const last7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }
    return days;
};
const fmtShortDay = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });
const dayBucket = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

const catColor = (key) => {
    const colors = {
        salary: '#10b981', food: '#f97316', transport: '#3b82f6',
        shopping: '#ec4899', bills: '#ef4444', entertainment: '#a855f7',
        health: '#06b6d4', other: '#64748b'
    };
    return colors[key] || '#64748b';
};

function Finance() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('food');
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');

    const reload = async () => {
        try {
            const data = await txApi.list();
            setTransactions(data);
        } catch (e) {
            setError('Failed to load transactions.');
        }
    };

    useEffect(() => {
        (async () => {
            await reload();
            setLoading(false);
        })();
    }, []);

    const addTransaction = async () => {
        setError('');
        if (description.trim() === '' || amount === '') return;
        let amt = Number(amount);
        if (type === 'expense' && amt > 0) amt = -amt;
        if (type === 'income' && amt < 0) amt = Math.abs(amt);
        try {
            await txApi.create({ description: description.trim(), amount: amt, category, type });
            setDescription('');
            setAmount('');
            await reload();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to add transaction.');
        }
    };

    const removeTransaction = async (id) => {
        try {
            await txApi.remove(id);
            await reload();
        } catch (e) {
            setError('Failed to delete transaction.');
        }
    };

    const totalBalance = transactions.reduce((s, t) => s + t.amount, 0);
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

    const filtered = transactions.filter(t => {
        if (filter === 'income') return t.amount > 0;
        if (filter === 'expense') return t.amount < 0;
        if (filter !== 'all') return t.category === filter;
        return true;
    });

    const days = last7Days();
    const series = days.map(iso => {
        const cutoff = new Date(iso).setHours(23, 59, 59, 999);
        return { day: fmtShortDay(iso), balance: transactions.filter(t => new Date(t.createdAt).getTime() <= cutoff).reduce((s, t) => s + t.amount, 0) };
    });

    const expenseByCat = CATS.map(c => ({
        name: c.label,
        value: transactions.filter(t => t.amount < 0 && t.category === c.key).reduce((s, t) => s + Math.abs(t.amount), 0)
    })).filter(x => x.value > 0);

    if (loading) {
        return (
            <div className="loading-screen" style={{ minHeight: 'auto', padding: 80 }}>
                <div className="spinner" />
                <div>Loading transactions...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="section-title">Finance Tracker</div>
            <div className="section-sub">Track income and expenses. All data syncs to your account.</div>

            <div className="grid grid-3 mb-md">
                <div className="kpi finance">
                    <div className="kpi-icon">◆</div>
                    <div className="kpi-label">Balance</div>
                    <div className="kpi-value" style={{ color: totalBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        ${Math.abs(totalBalance).toFixed(2)}
                    </div>
                    <div className="kpi-sub muted">{transactions.length} transactions</div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>↗</div>
                    <div className="kpi-label">Income</div>
                    <div className="kpi-value" style={{ color: 'var(--success)' }}>+${totalIncome.toFixed(2)}</div>
                    <div className="kpi-sub muted">
                        {transactions.filter(t => t.amount > 0).length} entries
                    </div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>↘</div>
                    <div className="kpi-label">Expenses</div>
                    <div className="kpi-value" style={{ color: 'var(--danger)' }}>-${totalExpense.toFixed(2)}</div>
                    <div className="kpi-sub muted">
                        {transactions.filter(t => t.amount < 0).length} entries
                    </div>
                </div>
            </div>

            <div className="card mb-md">
                <div className="card-header">
                    <div>
                        <div className="card-title">Add Transaction</div>
                        <div className="card-sub">Log income or expense</div>
                    </div>
                </div>
                <div className="tabs">
                    <button className={'tab ' + (type === 'expense' ? 'active' : '')} onClick={() => setType('expense')}>↘ Expense</button>
                    <button className={'tab ' + (type === 'income' ? 'active' : '')} onClick={() => setType('income')}>↗ Income</button>
                </div>
                {error && <div className="auth-error">{error}</div>}
                <div className="form-row">
                    <div className="field">
                        <label>Description</label>
                        <input className="input" placeholder="e.g. Groceries from store" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Amount ($)</label>
                        <input className="input" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Category</label>
                        <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
                            {CATS.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                        </select>
                    </div>
                    <div className="field" style={{ justifyContent: 'flex-end' }}>
                        <label>&nbsp;</label>
                        <button className="btn primary" onClick={addTransaction}>Add Transaction</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-2-1 mb-md">
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Balance Trend</div>
                            <div className="card-sub">Last 7 days</div>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 240 }}>
                        <ResponsiveContainer>
                            <AreaChart data={series}>
                                <defs>
                                    <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#232938" />
                                <XAxis dataKey="day" stroke="#5b6377" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#5b6377" tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} fill="url(#finGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Spending by Category</div>
                            <div className="card-sub">Where your money goes</div>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 240 }}>
                        {expenseByCat.length === 0 ? (
                            <div className="empty"><div className="empty-icon">○</div>No expenses yet.</div>
                        ) : (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={expenseByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={2}>
                                        {expenseByCat.map((d, i) => <Cell key={i} fill={catColor(CATS.find(c => c.label === d.name)?.key)} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Transactions</div>
                        <div className="card-sub">{filtered.length} of {transactions.length} entries</div>
                    </div>
                </div>
                <div className="tabs mb-md">
                    <button className={'tab ' + (filter === 'all' ? 'active' : '')} onClick={() => setFilter('all')}>All</button>
                    <button className={'tab ' + (filter === 'income' ? 'active' : '')} onClick={() => setFilter('income')}>Income</button>
                    <button className={'tab ' + (filter === 'expense' ? 'active' : '')} onClick={() => setFilter('expense')}>Expense</button>
                    {CATS.slice(0, 5).map(c => (
                        <button key={c.key} className={'tab ' + (filter === c.key ? 'active' : '')} onClick={() => setFilter(c.key)}>
                            {c.icon} {c.label}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <div className="empty"><div className="empty-icon">○</div>No transactions match this filter.</div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Date</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th style={{ width: 60 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(t => (
                                <tr key={t._id}>
                                    <td>
                                        <span className={'badge ' + (t.amount >= 0 ? 'success' : 'danger')}>
                                            {t.amount >= 0 ? '↗ IN' : '↘ OUT'}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-0)', fontWeight: 500 }}>{t.description}</td>
                                    <td>
                                        <span className="badge" style={{ background: catColor(t.category) + '22', color: catColor(t.category) }}>
                                            {CATS.find(c => c.key === t.category)?.label || t.category}
                                        </span>
                                    </td>
                                    <td className="muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'right' }} className={t.amount >= 0 ? 'amount-positive' : 'amount-negative'}>
                                        {t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                                    </td>
                                    <td>
                                        <button className="btn ghost sm" onClick={() => removeTransaction(t._id)}>✕</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Finance;
