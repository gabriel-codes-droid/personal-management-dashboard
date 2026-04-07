import './App.css';
import { useState, useEffect } from 'react';

function Home() {
    const [totalBalance, setTotalBalance] = useState(0);
    const [totalCalories, setTotalCalories] = useState(0);
    const [totalActivities, setTotalActivities] = useState(0);
    const [doneActivities, setDoneActivities] = useState(0);
    const [warnings, setWarnings] = useState([]);
    const [popup, setPopup] = useState(null);

    useEffect(() => {
        // Finance stats
        const transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
        const balance = transactions.reduce((total, t) => total + t.amount, 0);
        setTotalBalance(balance);

        // Meal stats
        const meals = JSON.parse(localStorage.getItem("meals") || "[]");
        const calories = meals.reduce((total, m) => total + Number(m.calories), 0);
        setTotalCalories(calories);

        // Activity stats
        const activities = JSON.parse(localStorage.getItem("activities") || "[]");
        setTotalActivities(activities.length);
        const done = activities.filter(a => a.done).length;
        setDoneActivities(done);

        // Generate warnings
        const generated = [];

        // Calorie warnings
        if (calories > 3000) {
            generated.push({ type: "danger", icon: "🚨", message: "You've logged over 3000 kcal! That's significantly above the daily recommended intake. Consider lighter meals." });
        } else if (calories > 2000) {
            generated.push({ type: "warning", icon: "🍔", message: "You're above the recommended 2000 kcal daily intake. Watch what you eat for the rest of the day." });
        } else if (calories < 500 && meals.length > 0) {
            generated.push({ type: "info", icon: "🥗", message: "Your calorie intake seems very low. Make sure you're eating enough to stay energized!" });
        } else if (meals.length === 0) {
            generated.push({ type: "info", icon: "🍽️", message: "No meals logged yet today. Don't forget to track your food intake!" });
        } else {
            generated.push({ type: "success", icon: "✅", message: "Great job! Your calorie intake is within the healthy range today." });
        }

        // Finance warnings
        if (balance < 0) {
            generated.push({ type: "danger", icon: "💸", message: "Your balance is negative! You're spending more than you earn. Time to review your expenses." });
        } else if (balance < 100) {
            generated.push({ type: "warning", icon: "⚠️", message: "Your balance is getting low. Be mindful of your spending." });
        } else {
            generated.push({ type: "success", icon: "💰", message: "Your finances are looking healthy. Keep it up!" });
        }

        // Activity warnings
        if (activities.length >= 6 && done < activities.length / 2) {
            generated.push({ type: "danger", icon: "😓", message: "You have a lot of activities and haven't completed most of them. You might be overloading yourself — remember to rest!" });
        } else if (activities.length >= 4) {
            generated.push({ type: "warning", icon: "😅", message: "You have quite a packed schedule today. Make sure to take breaks and not stress yourself out." });
        } else if (done === activities.length && activities.length > 0) {
            generated.push({ type: "success", icon: "🏆", message: "Amazing! You've completed all your activities today. Well done!" });
        } else if (activities.length === 0) {
            generated.push({ type: "info", icon: "🏃", message: "No activities scheduled yet. Add some to stay on track!" });
        }

        setWarnings(generated);

        // Show popup for urgent warnings only
        const urgent = generated.find(w => w.type === "danger");
        if (urgent) setPopup(urgent);

    }, []);

    const warningColors = {
        danger: "#ff4444",
        warning: "#ffaa00",
        success: "#00cc66",
        info: "#646cff"
    };

    return (
        <div className="dashboard-container">

            {/* Popup */}
            {popup && (
                <div style={{
                    position: "fixed",
                    top: "20px",
                    right: "20px",
                    background: "#1a1a1a",
                    border: `2px solid ${warningColors.danger}`,
                    borderRadius: "12px",
                    padding: "16px 20px",
                    maxWidth: "320px",
                    boxShadow: `0 0 20px rgba(255, 68, 68, 0.5)`,
                    zIndex: 1000,
                    color: "white"
                }}>
                    <p style={{ fontSize: "1.2rem" }}>{popup.icon} <strong>Urgent Alert</strong></p>
                    <p style={{ color: "#ccc", marginTop: "8px", fontSize: "0.9rem" }}>{popup.message}</p>
                    <button
                        onClick={() => setPopup(null)}
                        style={{
                            marginTop: "12px",
                            padding: "6px 14px",
                            borderRadius: "8px",
                            border: "2px solid #ff4444",
                            background: "transparent",
                            color: "#ff4444",
                            cursor: "pointer",
                            fontWeight: "bold"
                        }}>
                        Dismiss
                    </button>
                </div>
            )}

            <h2>Welcome to your Personal Management Dashboard</h2>
            <h3>What PMD (Personal Management Dashboard) does:</h3>

            {/* 3 Boxes */}
            <div>
                <div className="finance">
                    <h3>💰 Finance Tracker</h3>
                    <p>Track your income and expenses in one place.</p>
                    <br />
                    <p>Total Balance:
                        <strong style={{ color: totalBalance >= 0 ? "#00cc66" : "#ff4444" }}>
                            {" "}${totalBalance}
                        </strong>
                    </p>
                </div>

                <div className="activity">
                    <h3>🏃 Activity Tracker</h3>
                    <p>Track your daily activities and schedule.</p>
                    <br />
                    <p>Total Activities: <strong style={{ color: "#646cff" }}>{totalActivities}</strong></p>
                    <p>Completed: <strong style={{ color: "#00cc66" }}>{doneActivities}</strong></p>
                    <p>Pending: <strong style={{ color: "#ff4444" }}>{totalActivities - doneActivities}</strong></p>
                </div>

                <div className="meal">
                    <h3>🍽️ Meal & Calorie Tracker</h3>
                    <p>Track your meals and monitor your calorie intake.</p>
                    <br />
                    <p>Total Meals: <strong style={{ color: "#646cff" }}>{JSON.parse(localStorage.getItem("meals") || "[]").length}</strong></p>
                    <p>Total Calories:
                        <strong style={{ color: totalCalories > 2000 ? "#ff4444" : "#00cc66" }}>
                            {" "}{totalCalories} kcal
                        </strong>
                    </p>
                    <p style={{ color: "#aaa", fontSize: "0.85rem" }}>
                        {totalCalories > 2000 ? "⚠️ Over recommended daily intake!" : "✅ Within daily intake"}
                    </p>
                </div>
            </div>

            {/* Warnings Section */}
            <div style={{ width: "80%", margin: "30px auto" }}>
                <h3 style={{ color: "white", marginBottom: "15px" }}>⚡ Health & Finance Insights</h3>
                {warnings.map((warning, index) => (
                    <div key={index} style={{
                        background: "#1a1a1a",
                        border: `2px solid ${warningColors[warning.type]}`,
                        borderRadius: "10px",
                        padding: "12px 18px",
                        marginBottom: "10px",
                        color: "white",
                        boxShadow: `0 0 10px ${warningColors[warning.type]}33`
                    }}>
                        {warning.icon} {warning.message}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Home;