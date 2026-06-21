import { useEffect, useState, useRef } from 'react';
import { activities as actApi } from './api';

function Activity() {
    const [mode, setMode] = useState('schedule');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [countdownInput, setCountdownInput] = useState('');
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [finished, setFinished] = useState(false);
    const intervalRef = useRef(null);
    const [now, setNow] = useState(new Date());

    const reload = async () => {
        try {
            const data = await actApi.list();
            setActivities(data);
        } catch (e) {
            setError('Failed to load activities.');
        }
    };

    useEffect(() => {
        (async () => {
            await reload();
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTime(prev => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current);
                        setIsRunning(false);
                        setFinished(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    const formatTime = (s) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':');
    };

    const getStatus = (a) => {
        const start = new Date(a.startTime);
        const end = new Date(a.endTime);
        const toStart = Math.floor((start - now) / 1000);
        const toEnd = Math.floor((end - now) / 1000);
        if (a.done) return { label: 'Done', color: 'success' };
        if (now < start) return { label: `Starts in ${formatTime(toStart)}`, color: 'info' };
        if (now >= start && now < end) return { label: `Ongoing · ${formatTime(toEnd)} left`, color: 'success' };
        return { label: 'Time is up', color: 'danger' };
    };

    const addActivity = async () => {
        setError('');
        if (title.trim() === '' || description.trim() === '' || !startTime || !endTime) {
            setError('Please fill in all fields.');
            return;
        }
        if (new Date(endTime) <= new Date(startTime)) {
            setError('End time must be after start time.');
            return;
        }
        try {
            await actApi.create({ title: title.trim(), description: description.trim(), startTime, endTime });
            setTitle(''); setDescription(''); setStartTime(''); setEndTime('');
            await reload();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to add activity.');
        }
    };

    const markDone = async (id) => {
        try {
            await actApi.update(id, { done: true });
            await reload();
        } catch (e) {
            setError('Failed to update activity.');
        }
    };

    const removeActivity = async (id) => {
        try {
            await actApi.remove(id);
            await reload();
        } catch (e) {
            setError('Failed to delete activity.');
        }
    };

    const startCountdown = () => {
        const n = Number(countdownInput);
        if (!n || n <= 0) return;
        setTime(n);
        setFinished(false);
        setIsRunning(true);
    };

    const scheduled = activities.filter(a => !a.done && now < new Date(a.startTime));
    const ongoing = activities.filter(a => !a.done && now >= new Date(a.startTime) && now < new Date(a.endTime));
    const done = activities.filter(a => a.done);

    const renderCard = (a) => {
        const s = getStatus(a);
        return (
            <div key={a._id} className="activity-card">
                <div className="row between">
                    <div className="title">{a.title}</div>
                    <span className={'badge ' + s.color}><span className="dot"></span>{s.label}</span>
                </div>
                <div style={{ color: 'var(--text-2)', fontSize: 11, margin: '4px 0' }}>{a.description}</div>
                <div className="meta">🕐 {new Date(a.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div className="row gap-sm mt-sm">
                    {!a.done && <button className="btn success sm" onClick={() => markDone(a._id)}>✓ Done</button>}
                    <button className="btn ghost sm" onClick={() => removeActivity(a._id)}>✕</button>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="loading-screen" style={{ minHeight: 'auto', padding: 80 }}>
                <div className="spinner" />
                <div>Loading activities...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="section-title">Activity Tracker</div>
            <div className="section-sub">Schedule activities, track live status, and run countdowns.</div>

            <div className="grid grid-3 mb-md">
                <div className="kpi activity">
                    <div className="kpi-icon">▣</div>
                    <div className="kpi-label">Total</div>
                    <div className="kpi-value">{activities.length}</div>
                    <div className="kpi-sub muted">activities</div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>✓</div>
                    <div className="kpi-label">Completed</div>
                    <div className="kpi-value">{done.length}</div>
                    <div className="kpi-sub muted">{activities.length ? Math.round((done.length / activities.length) * 100) : 0}% completion</div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon" style={{ background: 'var(--info-soft)', color: 'var(--info)' }}>◷</div>
                    <div className="kpi-label">Live now</div>
                    <div className="kpi-value">{ongoing.length}</div>
                    <div className="kpi-sub muted">in progress</div>
                </div>
            </div>

            <div className="tabs mb-md">
                <button className={'tab ' + (mode === 'schedule' ? 'active' : '')} onClick={() => setMode('schedule')}>📅 Schedule</button>
                <button className={'tab ' + (mode === 'countdown' ? 'active' : '')} onClick={() => setMode('countdown')}>⏳ Countdown</button>
            </div>

            {error && <div className="auth-error">{error}</div>}

            {mode === 'schedule' && (
                <div className="card mb-md">
                    <div className="card-header">
                        <div>
                            <div className="card-title">New Activity</div>
                            <div className="card-sub">Add to your schedule</div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="field">
                            <label>Title</label>
                            <input className="input" placeholder="e.g. Team meeting" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                        <div className="field" style={{ gridColumn: 'span 2' }}>
                            <label>Description</label>
                            <input className="input" placeholder="What is this activity about?" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <div className="field">
                            <label>Start</label>
                            <input className="input" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ colorScheme: 'dark' }} />
                        </div>
                        <div className="field">
                            <label>End</label>
                            <input className="input" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ colorScheme: 'dark' }} />
                        </div>
                        <div className="field" style={{ justifyContent: 'flex-end' }}>
                            <label>&nbsp;</label>
                            <button className="btn primary" onClick={addActivity}>+ Add Activity</button>
                        </div>
                    </div>
                </div>
            )}

            {mode === 'countdown' && (
                <div className="card mb-md">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Countdown Timer</div>
                            <div className="card-sub">Set a duration in seconds</div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="field">
                            <label>Duration (seconds)</label>
                            <input className="input" type="number" placeholder="e.g. 300" value={countdownInput} onChange={e => setCountdownInput(e.target.value)} />
                        </div>
                        <div className="field" style={{ justifyContent: 'flex-end' }}>
                            <label>&nbsp;</label>
                            <div className="row gap-sm">
                                <button className="btn primary" onClick={startCountdown} disabled={isRunning}>▶ Start</button>
                                <button className="btn ghost" onClick={() => setIsRunning(false)} disabled={!isRunning}>■ Stop</button>
                                <button className="btn ghost" onClick={() => { setIsRunning(false); setFinished(false); setTime(0); }}>↺ Reset</button>
                            </div>
                        </div>
                    </div>
                    <div className={'countdown' + (finished ? ' finished' : '')}>{formatTime(time)}</div>
                    {finished && <div className="badge danger" style={{ padding: '8px 12px' }}>⏰ Time is up!</div>}
                </div>
            )}

            <div className="grid grid-3">
                <div className="activity-col">
                    <div className="activity-col-header">
                        <div className="activity-col-title">Upcoming</div>
                        <span className="badge">{scheduled.length}</span>
                    </div>
                    {scheduled.length === 0 ? <div className="empty" style={{ padding: 20, fontSize: 12 }}>Nothing scheduled.</div> : scheduled.map(renderCard)}
                </div>
                <div className="activity-col">
                    <div className="activity-col-header">
                        <div className="activity-col-title">In progress</div>
                        <span className="badge info">{ongoing.length}</span>
                    </div>
                    {ongoing.length === 0 ? <div className="empty" style={{ padding: 20, fontSize: 12 }}>No live activities.</div> : ongoing.map(renderCard)}
                </div>
                <div className="activity-col">
                    <div className="activity-col-header">
                        <div className="activity-col-title">Completed</div>
                        <span className="badge success">{done.length}</span>
                    </div>
                    {done.length === 0 ? <div className="empty" style={{ padding: 20, fontSize: 12 }}>Nothing completed yet.</div> : done.map(renderCard)}
                </div>
            </div>
        </div>
    );
}

export default Activity;
