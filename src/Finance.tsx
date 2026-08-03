import { useState, useEffect } from 'react';
import { transactions as txApi, Transaction } from './api';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid, BarChart, Bar, LineChart, Line
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

const last7Days = (): string[] => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }
    return days;
};

const last6Months = (): Array<{ month: string; year: number }> => {
    const months: Array<{ month: string; year: number }> = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push({
            month: d.toLocaleDateString(undefined, { month: 'short' }),
            year: d.getFullYear()
        });
    }
    return months;
};

const fmtShortDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });
const dayBucket = (date: string) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

const catColor = (key: string) => {
    const colors: Record<string, string> = {
        salary: '#10b981', food: '#f97316', transport: '#3b82f6',
        shopping: '#ec4899', bills: '#ef4444', entertainment: '#a855f7',
        health: '#06b6d4', other: '#64748b'
    };
    return colors[key] || '#64748b';
};

interface SavingsGoal {
    id: string;
    name: string;
    target: number;
    current: number;
    deadline: string;
}

function Finance() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState('food');
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');
    const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([
        { id: '1', name: 'Emergency Fund', target: 10000, current: 3500, deadline: '2024-12-31' },
        { id: '2', name: 'Vacation', target: 3000, current: 1200, deadline: '2024-06-01' },
    ]);
    const [showGoals, setShowGoals] = useState(false);

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
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to add transaction.');
        }
    };

    const removeTransaction = async (id: string) => {
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

    // Monthly comparison data
    const months = last6Months();
    const monthlyData = months.map(({ month, year }) => {
        const monthTransactions = transactions.filter(t => {
            const d = new Date(t.createdAt);
            return d.getMonth() === new Date(`${month} 1, ${year}`).getMonth() && 
                   d.getFullYear() === year;
        });
        const income = monthTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
        const expense = monthTransactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
        return { month, income, expense, savings: income - expense };
    });

    // Income vs Expense trend
    const incomeExpenseData = days.map(iso => {
        const start = new Date(iso).setHours(0, 0, 0, 0);
        const end = new Date(iso).setHours(23, 59, 59, 999);
        const dayTransactions = transactions.filter(t => {
            const ts = new Date(t.createdAt).getTime();
            return ts >= start && ts <= end;
        });
        const income = dayTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
        const expense = dayTransactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
        return { day: fmtShortDay(iso), income, expense };
    });

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

            <div className="grid grid-2 mb-md">
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Income vs Expenses</div>
                            <div className="card-sub">Daily comparison (7 days)</div>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 240 }}>
                        <ResponsiveContainer>
                            <BarChart data={incomeExpenseData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#232938" />
                                <XAxis dataKey="day" stroke="#5b6377" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#5b6377" tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Monthly Overview</div>
                            <div className="card-sub">6-month trend</div>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 240 }}>
                        <ResponsiveContainer>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#232938" />
                                <XAxis dataKey="month" stroke="#5b6377" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#5b6377" tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} name="Savings" dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="card mb-md">
                <div className="card-header">
                    <div>
                        <div className="card-title">Savings Goals</div>
                        <div className="card-sub">Track your financial targets</div>
                    </div>
                    <button className="btn ghost sm" onClick={() => setShowGoals(!showGoals)}>
                        {showGoals ? 'Hide' : 'Show'}
                    </button>
                </div>
                {showGoals && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
                        {savingsGoals.map(goal => {
                            const progress = Math.min(100, (goal.current / goal.target) * 100);
                            const remaining = goal.target - goal.current;
                            const daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                            return (
                                <div key={goal.id} style={{ 
                                    background: 'var(--bg-2)', 
                                    border: '1px solid var(--border)', 
                                    borderRadius: 'var(--r-md)', 
                                    padding: 16 
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{goal.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{daysLeft} days left</div>
                                    </div>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>
                                        ${goal.current.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
                                        of ${goal.target.toLocaleString()} goal (${remaining.toLocaleString()} remaining)
                                    </div>
                                    <div style={{ height: 8, background: 'var(--bg-1)', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ 
                                            height: '100%', 
                                            width: `${progress}%`, 
                                            background: progress >= 100 ? 'var(--success)' : 'var(--finance)',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, textAlign: 'right' }}>
                                        {progress.toFixed(1)}% complete
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
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
