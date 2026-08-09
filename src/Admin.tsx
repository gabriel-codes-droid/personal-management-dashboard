import { useState, useEffect } from 'react';
import { admin, User, AdminStats } from './api';
import { useAuth } from './auth';

interface UserActivity {
    userId: string;
    action: string;
    timestamp: string;
    details?: string;
}

function Admin() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [userActivities, setUserActivities] = useState<UserActivity[]>([]);

    const reload = async () => {
        try {
            const [u, s] = await Promise.all([admin.listUsers(), admin.stats()]);
            setUsers(u);
            setStats(s);
        } catch (e) {
            setError('Failed to load admin data.');
        }
    };

    useEffect(() => {
        (async () => {
            await reload();
            setLoading(false);
        })();
    }, []);

    const setRole = async (id: string, role: 'user' | 'admin') => {
        try {
            await admin.setRole(id, role);
            await reload();
        } catch (e) {
            setError('Failed to update role.');
        }
    };

    const removeUser = async (id: string, email: string) => {
        if (!confirm(`Delete user ${email} and ALL their data? This cannot be undone.`)) return;
        try {
            await admin.deleteUser(id);
            await reload();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to delete user.');
        }
    };

    const toggleBan = async (id: string, username: string, currentBanned: boolean) => {
        const action = currentBanned ? 'unban' : 'ban';
        if (!confirm(`Are you sure you want to ${action} user ${username}?`)) return;
        try {
            await admin.banUser(id, !currentBanned);
            await reload();
        } catch (e: any) {
            setError(e.response?.data?.message || `Failed to ${action} user.`);
        }
    };

    const viewUserDetails = async (user: User) => {
        setSelectedUser(user);
        setShowUserModal(true);
        // Mock user activity data - in real app, this would come from backend
        setUserActivities([
            { userId: user._id, action: 'Account Created', timestamp: user.createdAt },
            { userId: user._id, action: 'Last Login', timestamp: new Date().toISOString() },
            { userId: user._id, action: 'Profile Updated', timestamp: new Date(Date.now() - 86400000).toISOString() },
        ]);
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    if (loading) {
        return (
            <div className="loading-screen" style={{ minHeight: 'auto', padding: 80 }}>
                <div className="spinner" />
                <div>Loading admin data...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="section-title">Admin Panel</div>
            <div className="section-sub">Manage users and view system stats. Signed in as {currentUser?.email}.</div>

            {error && <div className="auth-error">{error}</div>}

            {stats && (
                <div className="grid grid-4 mb-md">
                    <div className="kpi accent">
                        <div className="kpi-icon">◔</div>
                        <div className="kpi-label">Users</div>
                        <div className="kpi-value">{stats.totalUsers}</div>
                    </div>
                    <div className="kpi finance">
                        <div className="kpi-icon">◆</div>
                        <div className="kpi-label">Transactions</div>
                        <div className="kpi-value">{stats.totalTransactions}</div>
                    </div>
                    <div className="kpi meals">
                        <div className="kpi-icon">◉</div>
                        <div className="kpi-label">Meals</div>
                        <div className="kpi-value">{stats.totalMeals}</div>
                    </div>
                    <div className="kpi activity">
                        <div className="kpi-icon">▣</div>
                        <div className="kpi-label">Activities</div>
                        <div className="kpi-value">{stats.totalActivities}</div>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Users</div>
                        <div className="card-sub">{users.length} accounts</div>
                    </div>
                    <div className="row gap-sm">
                        <input 
                            className="input sm" 
                            placeholder="Search users..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: 200 }}
                        />
                        <select 
                            className="select sm"
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value as 'all' | 'user' | 'admin')}
                            style={{ width: 120 }}
                        >
                            <option value="all">All Roles</option>
                            <option value="user">Users</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>
                </div>

                <table className="table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Activity</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u._id}>
                                <td style={{ color: 'var(--text-0)', fontWeight: 500 }}>
                                    {u.username}
                                    {u._id === currentUser?._id && <span className="badge info" style={{ marginLeft: 8 }}>you</span>}
                                </td>
                                <td className="muted">{u.email}</td>
                                <td>
                                    {u.role === 'admin'
                                        ? <span className="admin-badge">★ Admin</span>
                                        : <span className="badge">user</span>
                                    }
                                </td>
                                <td className="muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button 
                                        className="btn ghost sm" 
                                        onClick={() => viewUserDetails(u)}
                                        title="View User Details"
                                    >
                                        👁 View
                                    </button>
                                </td>
                                <td>
                                    <div className="row gap-sm" style={{ justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn ghost sm"
                                            onClick={() => toggleBan(u._id, u.username, u.banned || false)}
                                            disabled={u._id === currentUser?._id}
                                            title={u.banned ? 'Unban user' : 'Ban user'}
                                        >
                                            {u.banned ? '🔓 Unban' : '🚫 Ban'}
                                        </button>
                                        <button
                                            className="btn ghost sm"
                                            onClick={() => setRole(u._id, u.role === 'admin' ? 'user' : 'admin')}
                                            disabled={u._id === currentUser?._id}
                                            title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                                        >
                                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                                        </button>
                                        <button
                                            className="btn danger sm"
                                            onClick={() => removeUser(u._id, u.email)}
                                            disabled={u._id === currentUser?._id || u.role === 'admin'}
                                            title="Delete user and all data"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="empty">
                        <div className="empty-icon">👥</div>
                        No users match your search criteria.
                    </div>
                )}
            </div>

            {showUserModal && selectedUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: 24, maxWidth: 500, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="row between mb-md">
                            <div className="card-title">User Details</div>
                            <button className="btn ghost sm" onClick={() => setShowUserModal(false)}>✕</button>
                        </div>
                        
                        <div className="card mb-md" style={{ background: 'var(--bg-2)' }}>
                            <div className="row gap-md mb-sm">
                                <div>
                                    <div className="muted">Username</div>
                                    <div style={{ fontWeight: 600 }}>{selectedUser.username}</div>
                                </div>
                                <div>
                                    <div className="muted">Email</div>
                                    <div style={{ fontWeight: 600 }}>{selectedUser.email}</div>
                                </div>
                                <div>
                                    <div className="muted">Role</div>
                                    <div style={{ fontWeight: 600 }}>{selectedUser.role}</div>
                                </div>
                            </div>
                            <div className="muted">Joined: {new Date(selectedUser.createdAt).toLocaleString()}</div>
                        </div>

                        <div className="card-title mb-sm">Recent Activity</div>
                        {userActivities.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {userActivities.map((activity, i) => (
                                    <div key={i} style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 'var(--r-sm)' }}>
                                        <div style={{ fontWeight: 500 }}>{activity.action}</div>
                                        <div className="muted" style={{ fontSize: 12 }}>{new Date(activity.timestamp).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty" style={{ padding: 40 }}>
                                <div className="empty-icon">📋</div>
                                No recent activity
                            </div>
                        )}

                        <div className="row gap-sm mt-md" style={{ justifyContent: 'flex-end' }}>
                            <button className="btn ghost" onClick={() => setShowUserModal(false)}>Close</button>
                            {selectedUser._id !== currentUser?._id && (
                                <button 
                                    className="btn primary"
                                    onClick={() => {
                                        setRole(selectedUser._id, selectedUser.role === 'admin' ? 'user' : 'admin');
                                        setShowUserModal(false);
                                    }}
                                >
                                    {selectedUser.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Admin;
