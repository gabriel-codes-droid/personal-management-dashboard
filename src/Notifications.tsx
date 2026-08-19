import { useState, useEffect } from 'react';
import { AppNotification } from './api';
import { notificationService } from './notificationService';
import api from './api';

function Notifications() {
    const [notifications, setNotifications] = useState<AppNotification[]>(() => notificationService.getNotifications());
    const [permission, setPermission] = useState<string>('default');
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [sendingDigest, setSendingDigest] = useState(false);
    const [digestMessage, setDigestMessage] = useState('');

    useEffect(() => {
        const checkPermission = () => {
            if ('Notification' in window) {
                setPermission(Notification.permission);
            }
        };
        checkPermission();
        
        // Load email notification preference
        const loadEmailPref = async () => {
            try {
                const user = await api.get('/auth/me');
                setEmailEnabled(user.data.emailNotificationsEnabled || false);
            } catch {
                // Ignore error
            }
        };
        loadEmailPref();
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

    const toggleEmailNotifications = async () => {
        try {
            await api.post('/analytics/toggle-email-notifications', { enabled: !emailEnabled });
            setEmailEnabled(!emailEnabled);
            setDigestMessage(!emailEnabled ? 'Email notifications enabled' : 'Email notifications disabled');
            setTimeout(() => setDigestMessage(''), 3000);
        } catch {
            setDigestMessage('Failed to update preferences');
            setTimeout(() => setDigestMessage(''), 3000);
        }
    };

    const sendDigest = async () => {
        setSendingDigest(true);
        setDigestMessage('');
        try {
            await api.post('/analytics/send-digest');
            setDigestMessage('Digest sent successfully!');
            setTimeout(() => setDigestMessage(''), 3000);
        } catch {
            setDigestMessage('Failed to send digest');
            setTimeout(() => setDigestMessage(''), 3000);
        } finally {
            setSendingDigest(false);
        }
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

            <div className="card mb-md">
                <div className="card-header">
                    <div>
                        <div className="card-title">Email Digest</div>
                        <div className="card-sub">Receive daily summary via email</div>
                    </div>
                    <button 
                        className={'btn ghost sm ' + (emailEnabled ? 'success' : '')}
                        onClick={toggleEmailNotifications}
                    >
                        {emailEnabled ? '✓ Enabled' : 'Enable'}
                    </button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
                    {emailEnabled 
                        ? 'Email digests are enabled. You will receive daily summaries.'
                        : 'Email digests are disabled. Enable to receive daily summaries.'
                    }
                </div>
                {digestMessage && (
                    <div className={'auth-error ' + (digestMessage.includes('success') || digestMessage.includes('enabled') ? 'success' : '')} style={{ marginBottom: 12 }}>
                        {digestMessage}
                    </div>
                )}
                <button 
                    className="btn primary sm" 
                    onClick={sendDigest}
                    disabled={!emailEnabled || sendingDigest}
                >
                    {sendingDigest ? 'Sending...' : '📧 Send Test Digest'}
                </button>
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
