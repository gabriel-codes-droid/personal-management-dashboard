import { useState, useEffect } from 'react';
import { AppNotification } from './api';
import { notificationService } from './notificationService';

function Notifications() {
    const [notifications, setNotifications] = useState<AppNotification[]>(() => notificationService.getNotifications());
    const [permission, setPermission] = useState<string>('default');

    useEffect(() => {
        const checkPermission = () => {
            if ('Notification' in window) {
                setPermission(Notification.permission);
            }
        };
        checkPermission();
    }, []);

    const refreshNotifications = () => {
        setNotifications(notificationService.getNotifications());
    };

    const clearAll = () => {
        notificationService.clearAll();
        setNotifications([]);
    };

    const markAllRead = () => {
        notificationService.markAllAsRead();
        refreshNotifications();
    };

    const requestPermission = async () => {
        const granted = await notificationService.requestPermission();
        setPermission(granted ? 'granted' : 'denied');
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

            <div className="card mb-md">
                <div className="card-header">
                    <div>
                        <div className="card-title">Push Notifications</div>
                        <div className="card-sub">Enable browser notifications for real-time alerts</div>
                    </div>
                    <button 
                        className="btn ghost sm" 
                        onClick={requestPermission}
                        disabled={permission === 'granted'}
                    >
                        {permission === 'granted' ? '✓ Enabled' : permission === 'denied' ? '✕ Blocked' : 'Enable'}
                    </button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    {permission === 'granted' 
                        ? 'Push notifications are enabled. You will receive alerts for important events.'
                        : permission === 'denied'
                        ? 'Push notifications are blocked. Enable them in your browser settings.'
                        : 'Click "Enable" to receive push notifications for important events.'
                    }
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
