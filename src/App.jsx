import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from "./Home";
import Finance from "./Finance";
import Meals from "./Meals";
import Activity from "./Activity";
import Notifications from "./Notifications";
import './App.css';

function Nav() {
    const navigate = useNavigate();
    const location = useLocation();
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    const unread = notifications.filter(n => !n.read).length;

    return (
        <nav>
            <button className={location.pathname === "/" ? "active" : ""} onClick={() => navigate("/")}>Home</button>
            <button className={location.pathname === "/finance" ? "active" : ""} onClick={() => navigate("/finance")}>Finance Tracker</button>
            <button className={location.pathname === "/meals" ? "active" : ""} onClick={() => navigate("/meals")}>Meal & Calorie Tracker</button>
            <button className={location.pathname === "/activity" ? "active" : ""} onClick={() => navigate("/activity")}>Activity Tracker</button>
            <button className={location.pathname === "/notifications" ? "active" : ""} onClick={() => navigate("/notifications")} style={{ position: "relative" }}>
                🔔
                {unread > 0 && (
                    <span style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        background: "#ff4444",
                        color: "white",
                        borderRadius: "50%",
                        width: "18px",
                        height: "18px",
                        fontSize: "0.7rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold"
                    }}>{unread}</span>
                )}
            </button>
        </nav>
    );
}

function App() {
    return (
        <Router>
            <Nav />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/meals" element={<Meals />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/notifications" element={<Notifications />} />
            </Routes>
        </Router>
    );
}

export default App;