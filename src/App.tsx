import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { ThemeProvider, useTheme } from './theme';
import { AppNotification } from './api';
import { 
  LayoutDashboard, 
  DollarSign, 
  Utensils, 
  Activity as ActivityIcon, 
  Bell, 
  Trash2, 
  Settings as SettingsIcon,
  Shield
} from 'lucide-react';
import Home from './Home';
import Finance from './Finance';
import Meals from './Meals';
import Activity from './Activity';
import Notifications from './Notifications';
import Trash from './Trash';
import Admin from './Admin';
import Settings from './Settings';
import Login from './Login';
import Signup from './SignUp';
import ForgotPassword from './ForgotPassword';
import './styles.css';

function Sidebar({ open }: { open: boolean }) {
    const [notifications, setNotifications] = useState<AppNotification[]>(() =>
        JSON.parse(localStorage.getItem('notifications') || '[]')
    );

    useEffect(() => {
        const sync = () =>
            setNotifications(JSON.parse(localStorage.getItem('notifications') || '[]'));
        window.addEventListener('storage', sync);
        const i = setInterval(sync, 1500);
        return () => {
            window.removeEventListener('storage', sync);
            clearInterval(i);
        };
    }, []);

    const unread = notifications.filter(n => !n.read).length;
    const { user } = useAuth();

    const link = (to: string, Icon: any, label: string, badge?: number) => (
        <NavLink to={to} end={to === '/'} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <Icon size={20} className="icon" />
            <span>{label}</span>
            {badge && badge > 0 && <span className="badge">{badge}</span>}
        </NavLink>
    );

    return (
        <aside className={"sidebar" + (open ? "" : " collapsed")}>
            <div className="sidebar-brand">
                <div className="logo">PMD</div>
                <div className="name">
                    PMD
                    <span>Personal Management</span>
                </div>
            </div>

            <div className="sidebar-label">Overview</div>
            {link('/', LayoutDashboard, 'Dashboard')}

            <div className="sidebar-label">Modules</div>
            {link('/finance', DollarSign, 'Finance')}
            {link('/meals', Utensils, 'Meals')}
            {link('/activity', ActivityIcon, 'Activity')}

            {user?.role === 'admin' && (
                <>
                    <div className="sidebar-label">Admin</div>
                    {link('/admin', Shield, 'Admin Panel')}
                </>
            )}

            <div className="sidebar-label">System</div>
            {link('/notifications', Bell, 'Notifications', unread)}
            {link('/trash', Trash2, 'Trash')}
            {link('/settings', SettingsIcon, 'Settings')}

            <div className="sidebar-footer">v1.0 · Synced to backend</div>
        </aside>
    );
}

function Topbar({ sidebarOpen, onToggleSidebar }: { sidebarOpen: boolean; onToggleSidebar: () => void }) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const titles: Record<string, string> = {
        '/': 'Dashboard',
        '/finance': 'Finance',
        '/meals': 'Meals',
        '/activity': 'Activity',
        '/admin': 'Admin',
        '/notifications': 'Notifications',
        '/trash': 'Trash',
        '/settings': 'Settings',
    };

    const today = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    });

    const onLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const initial = user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

    return (
        <header className="topbar">
            {sidebarOpen && (
                <div onClick={onToggleSidebar} className="sidebar-backdrop" />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                    className="btn ghost sidebar-toggle"
                    onClick={onToggleSidebar}
                    aria-label="Toggle sidebar"
                    title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                >
                    {sidebarOpen ? '◀' : '▶'}
                </button>
                <h1>{titles[location.pathname] || 'PMD'}</h1>
            </div>
            <div className="topbar-meta">
                <span>{today}</span>
                <button className="theme-btn" onClick={toggle} aria-label="Toggle theme" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                    {theme === 'dark' ? '☀' : '☾'}
                </button>
                <div style={{ position: 'relative' }}>
                    <div className="avatar" onClick={() => setMenuOpen(o => !o)} style={{ cursor: 'pointer' }} title={user?.email}>
                        {user?.profileImage ? (
                            <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            initial
                        )}
                    </div>
                    {menuOpen && (
                        <>
                            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 8px)',
                                right: 0,
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-strong)',
                                borderRadius: 'var(--r-md)',
                                padding: 8,
                                minWidth: 220,
                                boxShadow: 'var(--shadow-lg)',
                                zIndex: 51,
                            }}>
                                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {user?.username || 'User'}
                                        {user?.role === 'admin' && <span className="admin-badge">★ Admin</span>}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{user?.email}</div>
                                </div>
                                <button className="btn ghost" onClick={onLogout} style={{ width: '100%', justifyContent: 'flex-start' }}>
                                    🚪 Sign out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {mobileNavOpen && (
                <>
                    <div onClick={() => setMobileNavOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)' }} />
                    <div style={{
                        position: 'fixed',
                        top: 64,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'var(--bg-1)',
                        zIndex: 61,
                        padding: 20,
                        overflowY: 'auto',
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <NavLink to="/" className="nav-link" onClick={() => setMobileNavOpen(false)}>📊 Dashboard</NavLink>
                            <NavLink to="/finance" className="nav-link" onClick={() => setMobileNavOpen(false)}>💰 Finance</NavLink>
                            <NavLink to="/meals" className="nav-link" onClick={() => setMobileNavOpen(false)}>🍽️ Meals</NavLink>
                            <NavLink to="/activity" className="nav-link" onClick={() => setMobileNavOpen(false)}>🏃 Activity</NavLink>
                            {user?.role === 'admin' && (
                                <NavLink to="/admin" className="nav-link" onClick={() => setMobileNavOpen(false)}>🔧 Admin</NavLink>
                            )}
                            <NavLink to="/notifications" className="nav-link" onClick={() => setMobileNavOpen(false)}>🔔 Notifications</NavLink>
                            <NavLink to="/trash" className="nav-link" onClick={() => setMobileNavOpen(false)}>🗑️ Trash</NavLink>
                            <NavLink to="/settings" className="nav-link" onClick={() => setMobileNavOpen(false)}>⚙️ Settings</NavLink>
                        </div>
                    </div>
                </>
            )}
        </header>
    );
}

function ProtectedShell() {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = useCallback(() => {
        setSidebarOpen(o => !o);
    }, []);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <div>Loading...</div>
            </div>
        );
    }
    if (!user) return <Navigate to="/login" replace />;

    return (
        <div className="app">
            <Sidebar open={sidebarOpen} />
            <div className="main">
                <Topbar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
                <main className="page">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/finance" element={<Finance />} />
                        <Route path="/meals" element={<Meals />} />
                        <Route path="/activity" element={<Activity />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/trash" element={<Trash />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/admin" element={
                            user.role === 'admin' ? <Admin /> : <Navigate to="/" replace />
                        } />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

function AuthGate({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <div>Loading...</div>
            </div>
        );
    }
    if (user) return <Navigate to="/" replace />;
    return <>{children}</>;
}

function Shell() {
    return (
        <Routes>
            <Route path="/login" element={<AuthGate><Login /></AuthGate>} />
            <Route path="/signup" element={<AuthGate><Signup /></AuthGate>} />
            <Route path="/forgot-password" element={<AuthGate><ForgotPassword /></AuthGate>} />
            <Route path="/*" element={<ProtectedShell />} />
        </Routes>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <Shell />
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}
