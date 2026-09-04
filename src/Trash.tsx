import { useState, useEffect } from 'react';
import { trash as trashApi, TrashItem } from './api';
import { getFirebaseErrorMessage } from './firebaseErrorHandler';
import { Wallet, Utensils, CheckSquare, Circle } from 'lucide-react';

const TYPE_LABEL: Record<TrashItem['itemType'], string> = {
    transaction: 'Transaction',
    meal: 'Meal',
    activity: 'Activity',
};

const TYPE_ICON: Record<TrashItem['itemType'], React.ReactNode> = {
    transaction: <Wallet size={12} />,
    meal: <Utensils size={12} />,
    activity: <CheckSquare size={12} />,
};

function Trash() {
    const [items, setItems] = useState<TrashItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);

    const reload = async () => {
        try {
            const data = await trashApi.list();
            setItems(data);
            setError('');
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

    const restore = async (item: TrashItem) => {
        setBusyId(item.id);
        try {
            await trashApi.restore(item.itemType, item.id);
            await reload();
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err));
        } finally {
            setBusyId(null);
        }
    };

    const deleteForever = async (item: TrashItem) => {
        setBusyId(item.id);
        try {
            await trashApi.remove(item.itemType, item.id);
            await reload();
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err));
        } finally {
            setBusyId(null);
        }
    };

    const emptyTrash = async () => {
        if (items.length === 0) return;
        if (!window.confirm(`Permanently delete all ${items.length} item(s) in trash? This cannot be undone.`)) return;
        try {
            await trashApi.empty();
            await reload();
        } catch (err: any) {
            setError(getFirebaseErrorMessage(err));
        }
    };

    if (loading) {
        return (
            <div className="loading-screen" style={{ minHeight: 'auto', padding: 80 }}>
                <div className="spinner" />
                <div>Loading trash...</div>
            </div>
        );
    }

    const counts = {
        transaction: items.filter(i => i.itemType === 'transaction').length,
        meal: items.filter(i => i.itemType === 'meal').length,
        activity: items.filter(i => i.itemType === 'activity').length,
    };

    return (
        <div>
            <div className="section-title">Trash</div>
            <div className="section-sub">Deleted items land here first and can be restored, or permanently removed.</div>

            <div className="grid grid-3 mb-md">
                <div className="kpi finance">
                    <div className="kpi-icon"><Wallet size={18} /></div>
                    <div className="kpi-label">Transactions</div>
                    <div className="kpi-value">{counts.transaction}</div>
                </div>
                <div className="kpi meals">
                    <div className="kpi-icon"><Utensils size={18} /></div>
                    <div className="kpi-label">Meals</div>
                    <div className="kpi-value">{counts.meal}</div>
                </div>
                <div className="kpi activity">
                    <div className="kpi-icon"><CheckSquare size={18} /></div>
                    <div className="kpi-label">Activities</div>
                    <div className="kpi-value">{counts.activity}</div>
                </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Deleted Items</div>
                        <div className="card-sub">{items.length} item{items.length === 1 ? '' : 's'} in trash</div>
                    </div>
                    {items.length > 0 && (
                        <button className="btn ghost sm" onClick={emptyTrash}>Empty Trash</button>
                    )}
                </div>
                {items.length === 0 ? (
                    <div className="empty">
                        <div className="empty-icon"><Circle size={24} /></div>
                        Trash is empty. Deleted transactions, meals, and activities will show up here.
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Item</th>
                                <th>Deleted</th>
                                <th style={{ width: 160 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={`${item.itemType}-${item.id}`}>
                                    <td>
                                        <span className="badge">{TYPE_ICON[item.itemType]} {TYPE_LABEL[item.itemType]}</span>
                                    </td>
                                    <td style={{ color: 'var(--text-0)', fontWeight: 500 }}>
                                        {item.title || 'Untitled'}
                                        {item.details && <span className="muted" style={{ fontWeight: 400 }}> — {item.details}</span>}
                                    </td>
                                    <td className="muted">{new Date(item.deletedAt).toLocaleString()}</td>
                                    <td style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn ghost sm"
                                            disabled={busyId === item.id}
                                            onClick={() => restore(item)}
                                        >
                                            Restore
                                        </button>
                                        <button
                                            className="btn ghost sm"
                                            disabled={busyId === item.id}
                                            onClick={() => deleteForever(item)}
                                            style={{ color: 'var(--danger)' }}
                                        >
                                            Delete
                                        </button>
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

export default Trash;
