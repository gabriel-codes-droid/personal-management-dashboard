import './App.css';
import { useState, useEffect } from 'react';

function Home() {
    const [totalBalance, setTotalBalance] = useState(0);
    const [totalCalories, setTotalCalories] = useState(0);
    const [totalActivities, setTotalActivities] = useState(0);
    const [doneActivities, setDoneActivities] = useState(0);

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
        setDoneActivities(activities.filter(a => a.done).length);
    }, []);

    return (
        <div className="dashboard-container">
            <h2>Welcome to your Personal Management Dashboard</h2>
            <h3>What PMD (Personal Management Dashboard) does:</h3>
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
                    <p>Total Calories: <strong style={{ color: totalCalories > 2000 ? "#ff4444" : "#00cc66" }}>{totalCalories} kcal</strong></p>
                    <p style={{ color: "#aaa", fontSize: "0.85rem" }}>
                        {totalCalories > 2000 ? "⚠️ Over recommended daily intake!" : "✅ Within daily intake"}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Home;