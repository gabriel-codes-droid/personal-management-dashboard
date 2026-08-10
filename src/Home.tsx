import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transactions as txApi, meals as mealApi, activities as actApi, Transaction, Meal, Activity, AppNotification } from './api';
import { notificationService } from './notificationService';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
} from 'recharts';

const last7Days = (): string[] => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }
    return days;
};

const fmtShortDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });

const dayBucket = (date: string) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};


function Home() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [meals, setMeals] = useState<Meal[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const [txs, ms, acs] = await Promise.all([
                    txApi.list(), mealApi.list(), actApi.list()
                ]);
                setTransactions(txs);
                setMeals(ms);
                setActivities(acs);

                // Request notification permission on first load
                await notificationService.requestPermission();
                await notificationService.registerServiceWorker();

                // Generate notifications using the service
                const financeNotifications = notificationService.generateFinanceNotifications(txs);
                const mealNotifications = notificationService.generateMealNotifications(ms);
                const activityNotifications = notificationService.generateActivityNotifications(acs);

                const generated = [...financeNotifications, ...mealNotifications, ...activityNotifications];
                
                // Only add new notifications that don't already exist
                const existingNotifications = notificationService.getNotifications();
                const newNotifications = generated.filter(newNotif => 
                    !existingNotifications.some(existing => 
                        existing.message === newNotif.message && 
                        existing.type === newNotif.type
                    )
                );

                if (newNotifications.length > 0) {
                    newNotifications.forEach(notif => notificationService.addNotification(notif));
                }

                setNotifications(notificationService.getNotifications());
            } catch (e) {
                console.error('Dashboard load failed', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const totalBalance = transactions.reduce((s, t) => s + t.amount, 0);
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalCals = meals.reduce((s, m) => s + Number(m.calories), 0);
    const doneActivities = activities.filter(a => a.done).length;

    const success = '#10b981';
    const warning = '#f59e0b';
    const danger = '#ef4444';
    const finance = '#3b82f6';
    const mealsColor = '#f97316';

    const calLevel = totalCals <= 2000 ? { label: 'Healthy', color: success }
        : totalCals <= 2500 ? { label: 'Moderate', color: warning }
        : { label: 'High', color: danger };
    const finLevel = totalBalance > 500 ? { label: 'Healthy', color: success }
        : totalBalance > 100 ? { label: 'Low', color: warning }
        : totalBalance > 0 ? { label: 'Critical', color: warning }
        : { label: 'Danger', color: danger };
    const actLevel = activities.length === 0 ? { label: 'No activities', color: '#5b6377' }
        : doneActivities === activities.length ? { label: 'All done', color: success }
        : (activities.length - doneActivities) <= 2 ? { label: 'Low load', color: success }
        : (activities.length - doneActivities) <= 4 ? { label: 'Moderate', color: warning }
        : { label: 'Heavy', color: danger };

    const days = last7Days();
    const balanceSeries = days.map(iso => {
        const cutoff = new Date(iso).setHours(23, 59, 59, 999);
        const sum = transactions
            .filter(t => new Date(t.createdAt).getTime() <= cutoff)
            .reduce((s, t) => s + t.amount, 0);
        return { day: fmtShortDay(iso), balance: sum };
    });
    const expenseSeries = days.map(iso => {
        const start = new Date(iso).setHours(0, 0, 0, 0);
        const sum = transactions
            .filter(t => t.amount < 0 && dayBucket(t.createdAt) === start)
            .reduce((s, t) => s + Math.abs(t.amount), 0);
        return { day: fmtShortDay(iso), expense: sum };
    });

    const categoryData = [
        { name: 'Income', value: totalIncome, color: success },
        { name: 'Expense', value: totalExpense, color: danger },
    ].filter(x => x.value > 0);

    const feed = [
        ...transactions.slice(0, 5).map(t => ({
            type: 'finance', icon: t.amount >= 0 ? '↗' : '↘',
            text: t.description || (t.amount >= 0 ? 'Income' : 'Expense'),
            meta: (t.amount >= 0 ? '+' : '') + '$' + t.amount,
            color: t.amount >= 0 ? success : danger,
            ts: new Date(t.createdAt).getTime()
        })),
        ...meals.slice(0, 5).map(m => ({
            type: 'meals', icon: '◉', text: m.title, meta: m.calories + ' kcal', color: mealsColor, ts: new Date(m.createdAt).getTime()
        })),
        ...activities.slice(0, 5).map(a => ({
            type: 'activity', icon: a.done ? '✓' : '◷',
            text: a.title, meta: a.done ? 'Done' : 'Pending', color: a.done ? success : warning, ts: new Date(a.createdAt).getTime()
        })),
    ].sort((a, b) => b.ts - a.ts).slice(0, 8);

    if (loading) {
        return (
            <div className="loading-screen" style={{ minHeight: 'auto', padding: 80 }}>
                <div className="spinner" />
                <div>Loading your dashboard...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="section-title">Dashboard Overview</div>
            <div className="section-sub">
                Welcome back. Here's a snapshot of your finance, nutrition, and activity today.
            </div>

            <div className="grid grid-4 mb-md">
                <div className="kpi finance">
                    <div className="kpi-icon">◆</div>
                    <div className="kpi-label">Total Balance</div>
                    <div className="kpi-value" style={{ color: totalBalance >= 0 ? success : danger }}>
                        ${Math.abs(totalBalance).toFixed(2)}
                    </div>
                    <div className="kpi-sub">
                        <span className={'badge ' + (finLevel.color === success ? 'success' : finLevel.color === warning ? 'warning' : 'danger')}>
                            {finLevel.label}
                        </span>
                    </div>
                </div>

                <div className="kpi meals">
                    <div className="kpi-icon">◉</div>
                    <div className="kpi-label">Calories Today</div>
                    <div className="kpi-value">{totalCals}</div>
                    <div className="kpi-sub">
                        <span className={'badge ' + (calLevel.color === success ? 'success' : calLevel.color === warning ? 'warning' : 'danger')}>
                            {calLevel.label}
                        </span>
                        <span className="muted"> · {meals.length} meals</span>
                    </div>
                </div>

                <div className="kpi activity">
                    <div className="kpi-icon">▣</div>
                    <div className="kpi-label">Activities</div>
                    <div className="kpi-value">{doneActivities}<span className="muted" style={{ fontSize: 16, fontWeight: 500 }}> / {activities.length}</span></div>
                    <div className="kpi-sub">
                        <span className={'badge ' + (actLevel.color === success ? 'success' : actLevel.color === warning ? 'warning' : actLevel.color === danger ? 'danger' : 'info')}>
                            {actLevel.label}
                        </span>
                    </div>
                </div>

                <div className="kpi accent">
                    <div className="kpi-icon">◐</div>
                    <div className="kpi-label">Income · Expense</div>
                    <div className="kpi-value" style={{ fontSize: 18, display: 'flex', gap: 12, alignItems: 'baseline' }}>
                        <span style={{ color: success }}>+${totalIncome.toFixed(0)}</span>
                        <span style={{ color: danger }}>−${totalExpense.toFixed(0)}</span>
                    </div>
                    <div className="kpi-sub muted">Lifetime totals</div>
                </div>
            </div>

            <div className="grid grid-2-1 mb-md">
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Balance Trend</div>
                            <div className="card-sub">Cumulative balance over the last 7 days</div>
                        </div>
                        <span className="badge info"><span className="dot"></span> 7d</span>
                    </div>
                    <div style={{ width: '100%', height: 240 }}>
                        <ResponsiveContainer>
                            <AreaChart data={balanceSeries}>
                                <defs>
                                    <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={finance} stopOpacity={0.45} />
                                        <stop offset="95%" stopColor={finance} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#232938" />
                                <XAxis dataKey="day" stroke="#5b6377" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#5b6377" tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="balance" stroke={finance} strokeWidth={2} fill="url(#balGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Income vs Expense</div>
                            <div className="card-sub">Lifetime distribution</div>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 240 }}>
                        {categoryData.length === 0 ? (
                            <div className="empty"><div className="empty-icon">○</div>No transactions yet.</div>
                        ) : (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                                        {categoryData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div className="row" style={{ justifyContent: 'center', gap: 14, marginTop: 4 }}>
                        {categoryData.map(d => (
                            <div key={d.name} className="row" style={{ gap: 6, fontSize: 12 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                                <span className="muted">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-2-1 mb-md">
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Daily Expenses</div>
                            <div className="card-sub">Spending per day (last 7 days)</div>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer>
                            <BarChart data={expenseSeries}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#232938" />
                                <XAxis dataKey="day" stroke="#5b6377" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#5b6377" tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="expense" fill="#f97316" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Health Insights</div>
                            <div className="card-sub">Auto-generated alerts</div>
                        </div>
                        <Link to="/notifications" className="btn ghost sm">View all</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {notifications.slice(0, 4).map((n, i) => (
                            <div key={i} className={'notif ' + n.type}>
                                <div className="notif-icon">{n.icon}</div>
                                <div>
                                    <div className="notif-msg">{n.message}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Recent Activity</div>
                        <div className="card-sub">Latest items across all modules</div>
                    </div>
                </div>
                {feed.length === 0 ? (
                    <div className="empty"><div className="empty-icon">○</div>Nothing yet. Add a transaction, meal, or activity to get started.</div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}></th>
                                <th>Item</th>
                                <th>Module</th>
                                <th>Detail</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feed.map((f, i) => (
                                <tr key={i}>
                                    <td style={{ color: f.color, fontWeight: 700, fontSize: 16 }}>{f.icon}</td>
                                    <td style={{ color: 'var(--text-0)', fontWeight: 500 }}>{f.text || '—'}</td>
                                    <td>
                                        <span className={'badge ' + f.type}>{f.type}</span>
                                    </td>
                                    <td className="muted">{f.meta}</td>
                                    <td>
                                        <span className="badge info"><span className="dot"></span>{new Date(f.ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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

export default Home;
