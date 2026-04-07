import './App.css';
import { useEffect, useState } from 'react';

function Notifications() {
    const [notifications, setNotifications] = useState(() => {
        return JSON.parse(localStorage.getItem("notifications") || "[]");
    });

    const clearAll = () => {
        localStorage.setItem("notifications", "[]");
        setNotifications([]);
    };

    const warningColors = {
        danger: "#ff4444",
        warning: "#ffaa00",
        success: "#00cc66",
        info: "#646cff"
    };

    return (
        <div className="page-container">
            <h2>🔔 All Notifications</h2>
            {notifications.length === 0 ? (
                <p style={{ color: "#aaa" }}>No notifications yet.</p>
            ) : (
                <>
                    <button onClick={clearAll} style={{
                        marginBottom: "20px",
                        padding: "8px 18px",
                        borderRadius: "10px",
                        border: "2px solid #ff4444",
                        background: "transparent",
                        color: "#ff4444",
                        fontWeight: "bold",
                        cursor: "pointer"
                    }}>Clear All</button>
                    <div style={{ width: "80%" }}>
                        {notifications.map((n, index) => (
                            <div key={index} style={{
                                background: "#1a1a1a",
                                border: `2px solid ${warningColors[n.type]}`,
                                borderRadius: "10px",
                                padding: "12px 18px",
                                marginBottom: "10px",
                                color: "white",
                                boxShadow: `0 0 10px ${warningColors[n.type]}33`
                            }}>
                                <p>{n.icon} {n.message}</p>
                                <p style={{ color: "#aaa", fontSize: "0.75rem", marginTop: "6px" }}>🕐 {n.timestamp}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default Notifications;