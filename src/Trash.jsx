import { useState } from 'react';

// Trash kept as client-side for now — deleted items are removed from backend.
// Keeping the page so the UI doesn't break; restore from backend via re-create if needed.
function Trash() {
    const [trash] = useState(() => JSON.parse(localStorage.getItem('trash') || '[]'));

    return (
        <div>
            <div className="section-title">Trash</div>
            <div className="section-sub">Deleted items are removed from the server. Use the API to restore if needed.</div>

            <div className="grid grid-4 mb-md">
                <div className="kpi finance">
                    <div className="kpi-icon">◆</div>
                    <div className="kpi-label">Transactions</div>
                    <div className="kpi-value">{trash.filter(i => i.itemType === 'transaction').length}</div>
                </div>
                <div className="kpi meals">
                    <div className="kpi-icon">◉</div>
                    <div className="kpi-label">Meals</div>
                    <div className="kpi-value">{trash.filter(i => i.itemType === 'meal').length}</div>
                </div>
                <div className="kpi activity">
                    <div className="kpi-icon">▣</div>
                    <div className="kpi-label">Activities</div>
                    <div className="kpi-value">{trash.filter(i => i.itemType === 'activity').length}</div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon">◔</div>
                    <div className="kpi-label">Notifications</div>
                    <div className="kpi-value">{trash.filter(i => i.itemType === 'notification').length}</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Deleted Items</div>
                        <div className="card-sub">{trash.length} items in trash</div>
                    </div>
                </div>
                {trash.length === 0 ? (
                    <div className="empty">
                        <div className="empty-icon">○</div>
                        Trash is empty. With backend sync, deletes are permanent — use the dashboard's edit features to manage your data.
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Item</th>
                                <th>Deleted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trash.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <span className="badge">{item.itemType}</span>
                                    </td>
                                    <td style={{ color: 'var(--text-0)', fontWeight: 500 }}>
                                        {item.title || item.description || item.message || 'Unknown'}
                                    </td>
                                    <td className="muted">{item.deletedAt}</td>
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
