import { useState, useEffect } from 'react';
import { transactions as txApi, Transaction, savingsGoals as goalsApi, SavingsGoal } from './api';
import { getFirebaseErrorMessage } from './firebaseErrorHandler';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid, BarChart, Bar, LineChart, Line
} from 'recharts';
import {
  Briefcase, ChefHat, Car, ShoppingBag, FileText, Film, Heart, Circle,
  ArrowUpRight,
} from 'lucide-react';

const CATS = [
    { key: 'salary', label: 'Salary', icon: <Briefcase size={14} /> },
    { key: 'food', label: 'Food', icon: <ChefHat size={14} /> },
    { key: 'transport', label: 'Transport', icon: <Car size={14} /> },
    { key: 'shopping', label: 'Shopping', icon: <ShoppingBag size={14} /> },
    { key: 'bills', label: 'Bills', icon: <FileText size={14} /> },
    { key: 'entertainment', label: 'Entertainment', icon: <Film size={14} /> },
    { key: 'health', label: 'Health', icon: <Heart size={14} /> },
    { key: 'other', label: 'Other', icon: <Circle size={14} /> },
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

const catColor = (key: string) => {
    const colors: Record<string, string> = {
        salary: '#10b981', food: '#f97316', transport: '#3b82f6',
        shopping: '#ec4899', bills: '#ef4444', entertainment: '#a855f7',
        health: '#06b6d4', other: '#64748b'
    };
    return colors[key] || '#64748b';
};

function Finance() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [goalName, setGoalName] = useState('');
    const [goalTarget, setGoalTarget] = useState('');
    const [goalDeadline, setGoalDeadline] = useState('');
    const [goalError, setGoalError] = useState('');
    const [fundInputs, setFundInputs] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState('food');
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');

    const reload = async () => {
        try {
            const data = await txApi.list();
            setTransactions(data);
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err));
        }
    };

    const reloadGoals = async () => {
        try {
            const data = await goalsApi.list();
            setGoals(data);
        } catch (err: any) {
            setGoalError(getFirebaseErrorMessage(err));
        }
    };

    useEffect(() => {
        (async () => {
            await Promise.all([reload(), reloadGoals()]);
            setLoading(false);
        })();
    }, []);

    const addGoal = async () => {
        setGoalError('');
        if (goalName.trim() === '' || goalTarget === '') return;
        try {
            await goalsApi.create({
                name: goalName.trim(),
                target: Number(goalTarget),
                deadline: goalDeadline || undefined,
            });
            setGoalName('');
            setGoalTarget('');
            setGoalDeadline('');
            await reloadGoals();
        } catch (err: any) {
            setGoalError(getFirebaseErrorMessage(err));
        }
    };

    const addFunds = async (goal: SavingsGoal) => {
        const goalId = goal._id || goal.id;
        const amt = Number(fundInputs[goalId]);
        if (!amt || amt <= 0) return;
        try {
            await goalsApi.update(goalId, { current: goal.current + amt });
            setFundInputs(prev => ({ ...prev, [goalId]: '' }));
            await reloadGoals();
        } catch (err: any) {
            setGoalError(getFirebaseErrorMessage(err));
        }
    };

    const removeGoal = async (id: string) => {
        try {
            await goalsApi.remove(id);
            await reloadGoals();
        } catch (err: any) {
            setGoalError(getFirebaseErrorMessage(err));
        }
    };

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
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err));
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
                    <div className="kpi-icon"><Circle size={18} /></div>
                    <div className="kpi-label">Balance</div>
                    <div className="kpi-value" style={{ color: totalBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        ${Math.abs(totalBalance).toFixed(2)}
                    </div>
                    <div className="kpi-sub muted">{transactions.length} transactions</div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}><ArrowUpRight size={18} /></div>
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
                        <ResponsiveContainer width="100%" height="100%">
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
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={expenseByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={2}>
                                        {expenseByCat.map((d, i) => <Cell key={i} fill={catColor(CATS.find(c => c.label === d.name)?.key ?? '')} />)}
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
                        <ResponsiveContainer width="100%" height="100%">
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
                        <ResponsiveContainer width="100%" height="100%">
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
                </div>
                {goalError && <div className="auth-error">{goalError}</div>}
                <div className="form-row mb-md">
                    <div className="field">
                        <label>Goal name</label>
                        <input className="input" placeholder="e.g. Emergency Fund" value={goalName} onChange={e => setGoalName(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Target ($)</label>
                        <input className="input" type="number" placeholder="0.00" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Deadline (optional)</label>
                        <input className="input" type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} />
                    </div>
                    <div className="field" style={{ justifyContent: 'flex-end' }}>
                        <label>&nbsp;</label>
                        <button className="btn primary" onClick={addGoal}>Add Goal</button>
                    </div>
                </div>
                {goals.length === 0 ? (
                    <div className="empty">
                        <div className="empty-icon">🎯</div>
                        No savings goals yet. Add one above to start tracking.
                    </div>
                ) : (
                    <div className="grid grid-3">
                        {goals.map(g => {
                            const pct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
                            const daysLeft = g.deadline
                                ? Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000))
                                : null;
                            return (
                                <div key={g._id || g.id} className="card" style={{ background: 'var(--surface-1)' }}>
                                    <div className="card-header">
                                        <div className="card-title" style={{ fontSize: 15 }}>{g.name}</div>
                                        <button className="btn ghost sm" onClick={() => removeGoal(g._id || g.id)}>✕</button>
                                    </div>
                                    <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
                                        ${g.current.toFixed(2)} of ${g.target.toFixed(2)}
                                        {daysLeft !== null && ` · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                                    </div>
                                    <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-2, #1e2433)', overflow: 'hidden', marginBottom: 12 }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--success)', transition: 'width 0.3s' }} />
                                    </div>
                                    <div className="form-row">
                                        <div className="field">
                                            <input
                                                className="input"
                                                type="number"
                                                placeholder="Add funds"
                                                value={fundInputs[g._id || g.id] || ''}
                                                onChange={e => setFundInputs(prev => ({ ...prev, [g._id || g.id]: e.target.value }))}
                                            />
                                        </div>
                                        <div className="field" style={{ justifyContent: 'flex-end' }}>
                                            <button className="btn ghost" onClick={() => addFunds(g)}>Add</button>
                                        </div>
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
                                        <button className="btn ghost sm" onClick={() => removeTransaction(t._id || t.id)}>✕</button>
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
