import { useState } from 'react';

function Notifications() {
    const [notifications, setNotifications] = useState(() => JSON.parse(localStorage.getItem('notifications') || '[]'));

    const clearAll = () => {
        localStorage.setItem('notifications', '[]');
        setNotifications([]);
    };

    const markAllRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        localStorage.setItem('notifications', JSON.stringify(updated));
        setNotifications(updated);
    };

    const unread = notifications.filter(n => !n.read).length;

    return (
        <div>
            <div className="section-title">Notifications</div>
            <div className="section-sub">Auto-generated alerts based on your activity, meals, and finances.</div>

            <div className="grid grid-3 mb-md">
                <div className="kpi accent">
                    <div className="kpi-icon">◔</div>
                    <div className="kpi-label">Total</div>
                    <div className="kpi-value">{notifications.length}</div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon" style={{ background: 'var(--info-soft)', color: 'var(--info)' }}>○</div>
                    <div className="kpi-label">Unread</div>
                    <div className="kpi-value">{unread}</div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>✓</div>
                    <div className="kpi-label">Read</div>
                    <div className="kpi-value">{notifications.length - unread}</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">All Notifications</div>
                        <div className="card-sub">Latest insights first</div>
                    </div>
                    <div className="row gap-sm">
                        <button className="btn ghost sm" onClick={markAllRead} disabled={unread === 0}>Mark all read</button>
                        <button className="btn danger sm" onClick={clearAll} disabled={notifications.length === 0}>Clear all</button>
                    </div>
                </div>

                {notifications.length === 0 ? (
                    <div className="empty"><div className="empty-icon">◔</div>No notifications yet. They'll appear here based on your activity.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {notifications.map((n, i) => (
                            <div key={i} className={'notif ' + (n.type || 'info')}>
                                <div className="notif-icon">{n.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div className="notif-msg">{n.message}</div>
                                    <div className="notif-time">🕐 {n.timestamp}</div>
                                </div>
                                {!n.read && <span className="badge info" style={{ alignSelf: 'flex-start' }}>new</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Notifications;
