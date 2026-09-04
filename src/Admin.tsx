import {
  Eye, X, Ban, CheckCircle2, ClipboardList, Lock, Users, Wallet, Utensils, CheckSquare, Star,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { admin, User, AdminStats } from './api';
import { useAuth } from './auth';
import { getFirebaseErrorMessage } from './firebaseErrorHandler';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

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
    const [adminNotice, setAdminNotice] = useState(true);

    const reload = async () => {
        try {
            // Client-side implementation - fetch users directly from Firestore
            const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            const usersSnapshot = await getDocs(usersQuery);
            const usersData = usersSnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            })) as User[];
            
            setUsers(usersData);
            
            // Get stats from Cloud Functions
            try {
                const statsData = await admin.stats();
                setStats(statsData);
            } catch {
                // Fallback to client-side calculation if functions fail
                const statsData: AdminStats = {
                    totalUsers: usersData.length,
                    totalTransactions: 0,
                    totalMeals: 0,
                    totalActivities: 0
                };
                setStats(statsData);
            }
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

    const setRole = async (id: string, role: 'user' | 'admin') => {
        try {
            await admin.setRole(id, role);
            await reload();
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err));
        }
    };

    const removeUser = async (id: string, email: string) => {
        if (!confirm(`Delete user ${email} and ALL their data? This cannot be undone.`)) return;
        try {
            await admin.deleteUser(id);
            await reload();
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err));
        }
    };

    const toggleBan = async (id: string, username: string, currentBanned: boolean) => {
        const action = currentBanned ? 'unban' : 'ban';
        if (!confirm(`Are you sure you want to ${action} user ${username}?`)) return;
        try {
            await admin.banUser(id, !currentBanned);
            await reload();
        } catch (err: any) {
            setError(err.message || 'Failed to update ban status');
        }
    };

    const viewUserDetails = async (user: User) => {
        setSelectedUser(user);
        setShowUserModal(true);
        try {
            // Fetch user activities from Cloud Functions
            const activities = await admin.getUserActivity(user.uid) as UserActivity[];
            setUserActivities(activities);
        } catch {
            setUserActivities([]);
        }
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

            {adminNotice && (
                <div className="card" style={{ background: 'var(--success-1)', border: '1px solid var(--success)', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}><CheckCircle2 size={20} /></span>
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>Admin Panel Fully Functional</div>
                            <div style={{ fontSize: 13 }}>
                                Admin operations are powered by Firebase Cloud Functions with full Admin SDK privileges. 
                                Features: view users, manage roles, ban/unban users, delete users, view activity logs, platform-wide stats.
                            </div>
                        </div>
                        <button
                            className="btn ghost sm"
                            onClick={() => setAdminNotice(false)}
                            style={{ marginLeft: 'auto' }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            {stats && (
                <div className="grid grid-4 mb-md">
                    <div className="kpi accent">
                        <div className="kpi-icon"><Users size={18} /></div>
                        <div className="kpi-label">Users</div>
                        <div className="kpi-value">{stats.totalUsers}</div>
                    </div>
                    <div className="kpi finance">
                        <div className="kpi-icon"><Wallet size={18} /></div>
                        <div className="kpi-label">Transactions</div>
                        <div className="kpi-value">{stats.totalTransactions}</div>
                    </div>
                    <div className="kpi meals">
                        <div className="kpi-icon"><Utensils size={18} /></div>
                        <div className="kpi-label">Meals</div>
                        <div className="kpi-value">{stats.totalMeals}</div>
                    </div>
                    <div className="kpi activity">
                        <div className="kpi-icon"><CheckSquare size={18} /></div>
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
                            <tr key={u.uid}>
                                <td style={{ color: 'var(--text-0)', fontWeight: 500 }}>
                                    {u.username}
                                    {u.uid === currentUser?.uid && <span className="badge info" style={{ marginLeft: 8 }}>you</span>}
                                </td>
                                <td className="muted">{u.email}</td>
                                <td>
                                    {u.role === 'admin'
                                        ? <span className="admin-badge"><Star size={11} className="inline mr-1" /> Admin</span>
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
                                        <Eye size={14} className="inline mr-1" /> View
                                    </button>
                                </td>
                                <td>
                                    <div className="row gap-sm" style={{ justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn ghost sm"
                                            onClick={() => toggleBan(u.uid, u.username, u.banned || false)}
                                            disabled={u.uid === currentUser?.uid}
                                            title={u.banned ? 'Unban user' : 'Ban user'}
                                        >
                                            {u.banned ? <><Lock size={14} className="inline mr-1" /> Unban</> : <><Ban size={14} className="inline mr-1" /> Ban</>}
                                        </button>
                                        <button
                                            className="btn ghost sm"
                                            onClick={() => setRole(u.uid, u.role === 'admin' ? 'user' : 'admin')}
                                            disabled={u.uid === currentUser?.uid}
                                            title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                                        >
                                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                                        </button>
                                        <button
                                            className="btn danger sm"
                                            onClick={() => removeUser(u.uid, u.email)}
                                            disabled={u.uid === currentUser?.uid || u.role === 'admin'}
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
                        <div className="empty-icon"><Users size={24} /></div>
                        No users match your search criteria.
                    </div>
                )}
            </div>

            {showUserModal && selectedUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: 24, maxWidth: 500, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="row between mb-md">
                            <div className="card-title">User Details</div>
                            <button className="btn ghost sm" onClick={() => setShowUserModal(false)}><X size={14} /></button>
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
                                <div className="empty-icon"><ClipboardList size={24} /></div>
                                No recent activity
                            </div>
                        )}

                        <div className="row gap-sm mt-md" style={{ justifyContent: 'flex-end' }}>
                            <button className="btn ghost" onClick={() => setShowUserModal(false)}>Close</button>
                            {selectedUser.uid !== currentUser?.uid && (
                                <button 
                                    className="btn primary"
                                    onClick={() => {
                                        setRole(selectedUser.uid, selectedUser.role === 'admin' ? 'user' : 'admin');
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
