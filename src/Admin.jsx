import { useState, useEffect } from 'react';
import { admin } from './api';
import { useAuth } from './auth';

function Admin() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    const setRole = async (id, role) => {
        try {
            await admin.setRole(id, role);
            await reload();
        } catch (e) {
            setError('Failed to update role.');
        }
    };

    const removeUser = async (id, email) => {
        if (!confirm(`Delete user ${email} and ALL their data? This cannot be undone.`)) return;
        try {
            await admin.deleteUser(id);
            await reload();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to delete user.');
        }
    };

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
                        <div className="kpi-value">{stats.users}</div>
                    </div>
                    <div className="kpi finance">
                        <div className="kpi-icon">◆</div>
                        <div className="kpi-label">Transactions</div>
                        <div className="kpi-value">{stats.transactions}</div>
                    </div>
                    <div className="kpi meals">
                        <div className="kpi-icon">◉</div>
                        <div className="kpi-label">Meals</div>
                        <div className="kpi-value">{stats.meals}</div>
                    </div>
                    <div className="kpi activity">
                        <div className="kpi-icon">▣</div>
                        <div className="kpi-label">Activities</div>
                        <div className="kpi-value">{stats.activities}</div>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Users</div>
                        <div className="card-sub">{users.length} accounts</div>
                    </div>
                </div>

                <table className="table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
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
                                    <div className="row gap-sm" style={{ justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn ghost sm"
                                            onClick={() => setRole(u._id, u.role === 'admin' ? 'user' : 'admin')}
                                            disabled={u._id === currentUser?._id}
                                        >
                                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                                        </button>
                                        <button
                                            className="btn danger sm"
                                            onClick={() => removeUser(u._id, u.email)}
                                            disabled={u._id === currentUser?._id || u.role === 'admin'}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Admin;
