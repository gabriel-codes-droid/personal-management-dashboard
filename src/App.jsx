import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from "./Home";
import Finance from "./Finance";
import Meals from "./Meals";
import Activity from "./Activity";
import './App.css';

function Nav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav>
      <button 
        className={location.pathname === "/" ? "active" : ""}
        onClick={() => navigate("/")}>Home</button>
      <button 
        className={location.pathname === "/finance" ? "active" : ""}
        onClick={() => navigate("/finance")}>Finance Tracker</button>
      <button 
        className={location.pathname === "/meals" ? "active" : ""}
        onClick={() => navigate("/meals")}>Meal & Calorie Tracker</button>
      <button 
        className={location.pathname === "/activity" ? "active" : ""}
        onClick={() => navigate("/activity")}>Activity Tracker</button>
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
      </Routes>
    </Router>
  );
}

export default App;