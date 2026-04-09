function Toast({ show, message, onUndo }) {
    if (!show) return null;

    return (
        <div style={{
            position: "fixed",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1a1a1a",
            border: "2px solid #646cff",
            borderRadius: "12px",
            padding: "12px 24px",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            zIndex: 2000,
            boxShadow: "0 0 20px rgba(100,108,255,0.4)"
        }}>
            <span>🗑️ Item deleted</span>
            <button onClick={onUndo} style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "2px solid #00cc66",
                background: "transparent",
                color: "#00cc66",
                fontWeight: "bold",
                cursor: "pointer"
            }}>Undo</button>
        </div>
    );
}

export default Toast;