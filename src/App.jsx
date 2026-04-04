import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from "./Home";
import Finance from "./Finance";
import Meals from "./Meals";
import Activity from "./Activity";
import './App.css';

function Nav() {
  const navigate = useNavigate();
  return (
    <nav>
      <button onClick={() => navigate("/")}>Home</button>
      <button onClick={() => navigate("/finance")}>Finance Tracker</button>
      <button onClick={() => navigate("/meals")}>Meal & Calorie Tracker</button>
      <button onClick={() => navigate("/activity")}>Activity Tracker</button>
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