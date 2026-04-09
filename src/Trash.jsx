import { useState } from 'react';
import './App.css';

function Trash() {
    const [trash, setTrash] = useState(() => {
        return JSON.parse(localStorage.getItem("trash") || "[]");
    });

    const typeColors = {
        transaction: "#00cc66",
        meal: "#646cff",
        activity: "#ffaa00",
        notification: "#ff4444"
    };

    const typeIcons = {
        transaction: "💰",
        meal: "🍽️",
        activity: "🏃",
        notification: "🔔"
    };

    const restoreItem = (item) => {
        // Add back to original list
        const key = item.itemType === "transaction" ? "transactions"
            : item.itemType === "meal" ? "meals"
            : item.itemType === "activity" ? "activities"
            : "notifications";

        const original = JSON.parse(localStorage.getItem(key) || "[]");
        // Remove trash-specific fields
        const { itemType, deletedAt, ...cleanItem } = item;
        original.push(cleanItem);
        localStorage.setItem(key, JSON.stringify(original));

        // Remove from trash
        const updated = trash.filter(i => i.id !== item.id);
        localStorage.setItem("trash", JSON.stringify(updated));
        setTrash(updated);
    };

    const permanentDelete = (item) => {
        const updated = trash.filter(i => i.id !== item.id);
        localStorage.setItem("trash", JSON.stringify(updated));
        setTrash(updated);
    };

    const emptyTrash = () => {
        localStorage.setItem("trash", "[]");
        setTrash([]);
    };

    const getItemName = (item) => {
        return item.title || item.description || item.message || "Unknown item";
    };

    return (
        <div className="page-container">
            <h2>🗑️ Trash</h2>
            <p style={{ color: "#aaa", marginBottom: "20px" }}>
                Items deleted from PMD. Restore or permanently delete them.
            </p>

            {trash.length === 0 ? (
                <p style={{ color: "#aaa" }}>Trash is empty.</p>
            ) : (
                <>
                    <button onClick={emptyTrash} style={{
                        marginBottom: "20px",
                        padding: "8px 18px",
                        borderRadius: "10px",
                        border: "2px solid #ff4444",
                        background: "transparent",
                        color: "#ff4444",
                        fontWeight: "bold",
                        cursor: "pointer",
                        boxShadow: "0 0 10px rgba(255,68,68,0.4)"
                    }}>🗑️ Empty Trash</button>

                    <div style={{ width: "80%" }}>
                        {trash.map((item, index) => (
                            <div key={index} style={{
                                background: "#1a1a1a",
                                border: `2px solid ${typeColors[item.itemType]}`,
                                borderRadius: "10px",
                                padding: "14px 18px",
                                marginBottom: "10px",
                                color: "white",
                                boxShadow: `0 0 10px ${typeColors[item.itemType]}33`,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "10px"
                            }}>
                                <div>
                                    <p>
                                        {typeIcons[item.itemType]}
                                        <span style={{
                                            color: typeColors[item.itemType],
                                            fontWeight: "bold",
                                            marginLeft: "6px",
                                            textTransform: "capitalize"
                                        }}>
                                            {item.itemType}
                                        </span>
                                        {" — "}
                                        {getItemName(item)}
                                    </p>
                                    <p style={{ color: "#aaa", fontSize: "0.75rem", marginTop: "4px" }}>
                                        🕐 Deleted at: {item.deletedAt}
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button onClick={() => restoreItem(item)} style={{
                                        padding: "6px 14px",
                                        borderRadius: "8px",
                                        border: "2px solid #00cc66",
                                        background: "transparent",
                                        color: "#00cc66",
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        boxShadow: "0 0 8px rgba(0,204,102,0.4)"
                                    }}>Restore</button>
                                    <button onClick={() => permanentDelete(item)} style={{
                                        padding: "6px 14px",
                                        borderRadius: "8px",
                                        border: "2px solid #ff4444",
                                        background: "transparent",
                                        color: "#ff4444",
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        boxShadow: "0 0 8px rgba(255,68,68,0.4)"
                                    }}>Delete Forever</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default Trash;