function ConfirmModal({ item, onConfirm, onCancel }) {
    if (!item) return null;

    // handles all possible item types
    const itemName = item.title || item.description || item.name || item.message || "this item";

    return (
        <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000
        }}>
            <div style={{
                background: "#1a1a1a",
                border: "2px solid #ff4444",
                borderRadius: "12px",
                padding: "24px 30px",
                maxWidth: "350px",
                width: "90%",
                color: "white",
                textAlign: "center",
                boxShadow: "0 0 20px rgba(255,68,68,0.4)"
            }}>
                <p style={{ fontSize: "1.3rem" }}>🗑️ <strong>Delete Item?</strong></p>
                <p style={{ color: "#ccc", margin: "12px 0", fontSize: "0.95rem" }}>
                    Are you sure you want to delete <strong style={{ color: "white" }}>"{itemName}"</strong>? This can be undone.
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
                    <button onClick={onCancel} style={{
                        padding: "8px 20px",
                        borderRadius: "10px",
                        border: "2px solid #646cff",
                        background: "transparent",
                        color: "#646cff",
                        fontWeight: "bold",
                        cursor: "pointer"
                    }}>Cancel</button>
                    <button onClick={onConfirm} style={{
                        padding: "8px 20px",
                        borderRadius: "10px",
                        border: "2px solid #ff4444",
                        background: "transparent",
                        color: "#ff4444",
                        fontWeight: "bold",
                        cursor: "pointer"
                    }}>Delete</button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;