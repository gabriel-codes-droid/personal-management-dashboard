import './App.css';
import { useState, useEffect } from 'react';

const ProgressBar = ({ value, max, color }) => {
    const percent = max === 0 ? 0 : Math.min((value / max) * 100, 100);
    return (
        <div style={{ background: "#333", borderRadius: "10px", height: "10px", width: "100%", margin: "8px 0" }}>
            <div style={{
                width: `${percent}%`,
                height: "100%",
                borderRadius: "10px",
                background: color,
                transition: "width 0.5s ease"
            }} />
        </div>
    );
};

function Home() {
    const [totalBalance, setTotalBalance] = useState(0);
    const [totalCalories, setTotalCalories] = useState(0);
    const [totalActivities, setTotalActivities] = useState(0);
    const [doneActivities, setDoneActivities] = useState(0);
    const [warnings, setWarnings] = useState([]);
    const [popup, setPopup] = useState(null);

    const warningColors = {
        danger: "#ff4444",
        warning: "#ffaa00",
        success: "#00cc66",
        info: "#646cff"
    };

    const getCalorieLevel = (calories) => {
        if (calories <= 2000) return { label: "🟢 Healthy", color: "#00cc66" };
        if (calories <= 2500) return { label: "🟡 Moderate", color: "#ffdd00" };
        if (calories <= 3000) return { label: "🟠 High", color: "#ffaa00" };
        return { label: "🔴 Danger", color: "#ff4444" };
    };

    const getFinanceLevel = (balance) => {
        if (balance > 500) return { label: "🟢 Healthy", color: "#00cc66" };
        if (balance > 100) return { label: "🟡 Low", color: "#ffdd00" };
        if (balance > 0) return { label: "🟠 Critical", color: "#ffaa00" };
        return { label: "🔴 Danger", color: "#ff4444" };
    };

    const getStressLevel = (total, done) => {
        const pending = total - done;
        if (pending === 0 && total > 0) return { label: "🟢 All Done!", color: "#00cc66" };
        if (pending <= 2) return { label: "🟢 Low Stress", color: "#00cc66" };
        if (pending <= 4) return { label: "🟡 Moderate", color: "#ffdd00" };
        if (pending <= 6) return { label: "🟠 High Stress", color: "#ffaa00" };
        return { label: "🔴 Overloaded!", color: "#ff4444" };
    };

    useEffect(() => {
        const transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
        const balance = transactions.reduce((total, t) => total + t.amount, 0);

        const meals = JSON.parse(localStorage.getItem("meals") || "[]");
        const calories = meals.reduce((total, m) => total + Number(m.calories), 0);

        const activities = JSON.parse(localStorage.getItem("activities") || "[]");
        const done = activities.filter(a => a.done).length;

        const generated = [];

        // Calorie warnings
        if (calories > 3000) {
            generated.push({ type: "danger", icon: "🚨", message: "You've logged over 3000 kcal! That's significantly above the daily recommended intake. Consider lighter meals.", timestamp: new Date().toLocaleString(), read: false });
        } else if (calories > 2000) {
            generated.push({ type: "warning", icon: "🍔", message: "You're above the recommended 2000 kcal daily intake. Watch what you eat for the rest of the day.", timestamp: new Date().toLocaleString(), read: false });
        } else if (calories < 500 && meals.length > 0) {
            generated.push({ type: "info", icon: "🥗", message: "Your calorie intake seems very low. Make sure you're eating enough to stay energized!", timestamp: new Date().toLocaleString(), read: false });
        } else if (meals.length === 0) {
            generated.push({ type: "info", icon: "🍽️", message: "No meals logged yet today. Don't forget to track your food intake!", timestamp: new Date().toLocaleString(), read: false });
        } else {
            generated.push({ type: "success", icon: "✅", message: "Great job! Your calorie intake is within the healthy range today.", timestamp: new Date().toLocaleString(), read: false });
        }

        // Finance warnings
        if (balance < 0) {
            generated.push({ type: "danger", icon: "💸", message: "Your balance is negative! You're spending more than you earn. Time to review your expenses.", timestamp: new Date().toLocaleString(), read: false });
        } else if (balance < 100) {
            generated.push({ type: "warning", icon: "⚠️", message: "Your balance is getting low. Be mindful of your spending.", timestamp: new Date().toLocaleString(), read: false });
        } else {
            generated.push({ type: "success", icon: "💰", message: "Your finances are looking healthy. Keep it up!", timestamp: new Date().toLocaleString(), read: false });
        }

        // Activity warnings
        if (activities.length >= 6 && done < activities.length / 2) {
            generated.push({ type: "danger", icon: "😓", message: "You have a lot of activities and haven't completed most of them. You might be overloading yourself — remember to rest!", timestamp: new Date().toLocaleString(), read: false });
        } else if (activities.length >= 4) {
            generated.push({ type: "warning", icon: "😅", message: "You have quite a packed schedule today. Make sure to take breaks and not stress yourself out.", timestamp: new Date().toLocaleString(), read: false });
        } else if (done === activities.length && activities.length > 0) {
            generated.push({ type: "success", icon: "🏆", message: "Amazing! You've completed all your activities today. Well done!", timestamp: new Date().toLocaleString(), read: false });
        } else if (activities.length === 0) {
            generated.push({ type: "info", icon: "🏃", message: "No activities scheduled yet. Add some to stay on track!", timestamp: new Date().toLocaleString(), read: false });
        }

        const urgent = generated.find(w => w.type === "danger");

        setTotalBalance(balance);
        setTotalCalories(calories);
        setTotalActivities(activities.length);
        setDoneActivities(done);
        setWarnings(generated);
        if (urgent) setPopup(urgent);

        localStorage.setItem("notifications", JSON.stringify(generated));

    }, []);

    const calorieLevel = getCalorieLevel(totalCalories);
    const financeLevel = getFinanceLevel(totalBalance);
    const stressLevel = getStressLevel(totalActivities, doneActivities);

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
                    <button onClick={() => setPopup(null)} style={{
                        marginTop: "12px",
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "2px solid #ff4444",
                        background: "transparent",
                        color: "#ff4444",
                        cursor: "pointer",
                        fontWeight: "bold"
                    }}>Dismiss</button>
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
                    <br />
                    <p>Health Level: <strong style={{ color: financeLevel.color }}>{financeLevel.label}</strong></p>
                    <ProgressBar value={totalBalance} max={1000} color={financeLevel.color} />
                </div>

                <div className="activity">
                    <h3>🏃 Activity Tracker</h3>
                    <p>Track your daily activities and schedule.</p>
                    <br />
                    <p>Total: <strong style={{ color: "#646cff" }}>{totalActivities}</strong></p>
                    <p>Completed: <strong style={{ color: "#00cc66" }}>{doneActivities}</strong></p>
                    <p>Pending: <strong style={{ color: "#ff4444" }}>{totalActivities - doneActivities}</strong></p>
                    <br />
                    <p>Stress Level: <strong style={{ color: stressLevel.color }}>{stressLevel.label}</strong></p>
                    <ProgressBar value={doneActivities} max={totalActivities} color={stressLevel.color} />
                </div>

                <div className="meal">
                    <h3>🍽️ Meal & Calorie Tracker</h3>
                    <p>Track your meals and monitor your calorie intake.</p>
                    <br />
                    <p>Total Meals: <strong style={{ color: "#646cff" }}>{JSON.parse(localStorage.getItem("meals") || "[]").length}</strong></p>
                    <p>Total Calories:
                        <strong style={{ color: calorieLevel.color }}>
                            {" "}{totalCalories} kcal
                        </strong>
                    </p>
                    <br />
                    <p>Health Level: <strong style={{ color: calorieLevel.color }}>{calorieLevel.label}</strong></p>
                    <ProgressBar value={totalCalories} max={3000} color={calorieLevel.color} />
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