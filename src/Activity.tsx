import { useEffect, useState, useRef } from 'react';
import { activities as actApi, type Activity } from './api';
import { getFirebaseErrorMessage } from './firebaseErrorHandler';
import {
  Clock,
  Check,
  X,
  Calendar,
  Timer,
  Bell,
} from 'lucide-react';

import { ListChecks, Play, Square, RotateCcw } from 'lucide-react';

function Activity() {
    const [mode, setMode] = useState<'schedule' | 'countdown'>('schedule');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [countdownInput, setCountdownInput] = useState('');
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [finished, setFinished] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const [now, setNow] = useState(new Date());

    const reload = async () => {
        try {
            const data = await actApi.list();
            setActivities(data);
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err));
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

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':');
    };

    const getStatus = (a: Activity) => {
        const start = new Date(a.startTime);
        const end = new Date(a.endTime);
        const toStart = Math.floor((start.getTime() - now.getTime()) / 1000);
        const toEnd = Math.floor((end.getTime() - now.getTime()) / 1000);
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
        } catch (e: any) {
            setError(getFirebaseErrorMessage(e));
        }
    };

    const markDone = async (id: string) => {
        try {
            await actApi.update(id, { done: true });
            await reload();
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err));
        }
    };

    const removeActivity = async (id: string) => {
        try {
            await actApi.remove(id);
            await reload();
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err));
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

    const renderCard = (a: Activity) => {
        const s = getStatus(a);
        return (
            <div key={a.id} className="activity-card">
                <div className="row between">
                    <div className="title">{a.title}</div>
                    <span className={'badge ' + s.color}><span className="dot"></span>{s.label}</span>
                </div>
                <div style={{ color: 'var(--text-2)', fontSize: 11, margin: '4px 0' }}>{a.description}</div>
                <div className="meta"><Clock size={11} className="inline mr-1" /> {new Date(a.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div className="row gap-sm mt-sm">
                    {!a.done && <button className="btn success sm" onClick={() => markDone(a.id)}><Check size={12} className="inline mr-1" /> Done</button>}
                    <button className="btn ghost sm" onClick={() => removeActivity(a.id)}><X size={12} /></button>
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
                    <div className="kpi-icon"><ListChecks size={18} /></div>
                    <div className="kpi-label">Total</div>
                    <div className="kpi-value">{activities.length}</div>
                    <div className="kpi-sub muted">activities</div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}><Check size={18} /></div>
                    <div className="kpi-label">Completed</div>
                    <div className="kpi-value">{done.length}</div>
                    <div className="kpi-sub muted">{activities.length ? Math.round((done.length / activities.length) * 100) : 0}% completion</div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon" style={{ background: 'var(--info-soft)', color: 'var(--info)' }}><Timer size={18} /></div>
                    <div className="kpi-label">Live now</div>
                    <div className="kpi-value">{ongoing.length}</div>
                    <div className="kpi-sub muted">in progress</div>
                </div>
            </div>

            <div className="tabs mb-md">
                <button className={'tab ' + (mode === 'schedule' ? 'active' : '')} onClick={() => setMode('schedule')}><Calendar size={13} className="inline mr-1" /> Schedule</button>
                <button className={'tab ' + (mode === 'countdown' ? 'active' : '')} onClick={() => setMode('countdown')}><Timer size={13} className="inline mr-1" /> Countdown</button>
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
                                <button className="btn primary" onClick={startCountdown} disabled={isRunning}><Play size={13} className="inline mr-1" /> Start</button>
                                <button className="btn ghost" onClick={() => setIsRunning(false)} disabled={!isRunning}><Square size={13} className="inline mr-1" /> Stop</button>
                                <button className="btn ghost" onClick={() => { setIsRunning(false); setFinished(false); setTime(0); }}><RotateCcw size={13} className="inline mr-1" /> Reset</button>
                            </div>
                        </div>
                    </div>
                    <div className={'countdown' + (finished ? ' finished' : '')}>{formatTime(time)}</div>
                    {finished && <div className="badge danger" style={{ padding: '8px 12px' }}><Bell size={13} className="inline mr-1" /> Time is up!</div>}
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
