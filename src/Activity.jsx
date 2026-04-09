import './App.css';
import { useEffect, useState, useRef } from "react";
import ConfirmModal from "./ConfirmModal";
import Toast from "./Toast";
import useDeleteWithUndo from "./useDeleteWithUndo";

function Activity() {
    const [mode, setMode] = useState("schedule");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [activities, setActivities] = useState(() => {
        const saved = localStorage.getItem("activities");
        return saved ? JSON.parse(saved) : [];
    });
    const [countdownInput, setCountdownInput] = useState("");
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [finished, setFinished] = useState(false);
    const intervalRef = useRef(null);
    const [now, setNow] = useState(new Date());

    const { deletedItem, showToast, triggerDelete, confirmDelete, undoDelete, setDeletedItem } = useDeleteWithUndo();

    useEffect(() => {
        localStorage.setItem("activities", JSON.stringify(activities));
    }, [activities]);

    useEffect(() => {
        const clockInterval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(clockInterval);
    }, []);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTime(prev => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current);
                        setIsRunning(false);
                        setFinished(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const getScheduleStatus = (activity) => {
        const start = new Date(activity.startTime);
        const end = new Date(activity.endTime);
        const diffToStart = Math.floor((start - now) / 1000);
        const diffToEnd = Math.floor((end - now) / 1000);
        if (activity.done) return { label: "✅ Done", color: "#00cc66" };
        if (now < start) return { label: `⏳ Starts in ${formatTime(diffToStart)}`, color: "#646cff" };
        if (now >= start && now < end) return { label: `🟢 Ongoing — ${formatTime(diffToEnd)} left`, color: "#00cc66" };
        return { label: "⚠️ Time is up!", color: "#ff4444" };
    };

    const addActivity = () => {
        if (title.trim() === "" || description.trim() === "" || !startTime || !endTime) {
            alert("Please fill in all fields");
            return;
        }
        if (new Date(endTime) <= new Date(startTime)) {
            alert("End time must be after start time");
            return;
        }
        setActivities(prev => [...prev, { id: Date.now(), title, description, startTime, endTime, done: false }]);
        setTitle("");
        setDescription("");
        setStartTime("");
        setEndTime("");
    };

    const markDone = (id) => {
        setActivities(prev => prev.map(a => a.id === id ? { ...a, done: true } : a));
    };

    const startCountdown = () => {
        if (!countdownInput || Number(countdownInput) <= 0) {
            alert("Please enter a valid time in seconds");
            return;
        }
        setTime(Number(countdownInput));
        setFinished(false);
        setIsRunning(true);
    };

    return (
        <div className="page-container">
            <ConfirmModal
                item={deletedItem?.item}
                onConfirm={() => confirmDelete(activities, setActivities)}
                onCancel={() => setDeletedItem(null)}
            />
            <Toast
                show={showToast}
                message="Activity deleted"
                onUndo={() => undoDelete(activities, setActivities)}
            />

            <h2>Activity Tracker</h2>
            <p style={{ color: "#aaa", marginBottom: "20px" }}>Track your physical activities and workouts</p>

            <div className="form-group">
                <select className="mode-select" value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option value="schedule">📅 Schedule Activity</option>
                    <option value="countdown">⏳ Countdown Timer</option>
                </select>
            </div>

            {mode === "schedule" && (
                <div className="form-group">
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Activity Title e.g. Team Meeting" />
                    <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
                    <label style={{ color: "#aaa", fontSize: "0.9rem" }}>Start Time</label>
                    <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ colorScheme: "dark" }} />
                    <label style={{ color: "#aaa", fontSize: "0.9rem" }}>End Time</label>
                    <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ colorScheme: "dark" }} />
                    <button onClick={addActivity}>Add Activity</button>

                    <ul className="meals-list" style={{ width: "100%" }}>
                        {activities.map(activity => {
                            const status = getScheduleStatus(activity);
                            return (
                                <li key={activity.id} style={{ borderColor: status.color, flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                                    <strong style={{ fontSize: "1.1rem" }}>{activity.title}</strong>
                                    <span style={{ color: "#aaa" }}>{activity.description}</span>
                                    <span style={{ color: "#aaa", fontSize: "0.85rem" }}>
                                        🕐 {new Date(activity.startTime).toLocaleString()} → {new Date(activity.endTime).toLocaleString()}
                                    </span>
                                    <span style={{ color: status.color, fontWeight: "bold" }}>{status.label}</span>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        {!activity.done && <button onClick={() => markDone(activity.id)}>Mark Done ✅</button>}
                                        <button onClick={() => triggerDelete(activity)}>Delete</button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {mode === "countdown" && (
                <div className="form-group">
                    <input type="number" placeholder="Set time in seconds" value={countdownInput} onChange={(e) => setCountdownInput(e.target.value)} />
                    <div style={{ fontSize: "3rem", fontWeight: "bold", color: finished ? "#ff4444" : "#646cff", letterSpacing: "4px", margin: "10px 0" }}>
                        {formatTime(time)}
                    </div>
                    {finished && <p style={{ color: "#ff4444" }}>⏰ Time is up!</p>}
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={startCountdown} disabled={isRunning}>Start</button>
                        <button onClick={() => setIsRunning(false)} disabled={!isRunning}>Stop</button>
                        <button onClick={() => { setIsRunning(false); setFinished(false); setTime(0); }}>Reset</button>
                    </div>
                </div>
            )}
        </div>
    );
}
export default Activity;