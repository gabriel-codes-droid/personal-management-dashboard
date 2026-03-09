import {BrowserRouter as Router, Routes, Route,Link} from 'react-router-dom';
import Home from "./Home";
import Finance from "./Finance";
import Meals from "./Meals";
import Activity from "./Activity";
function App(){
  return(
    <>
    <Router>
      <nav>
       <button> <Link to ="/">Home</Link></button>
        <button> <Link to ="/finance">Finance Tracker</Link></button>
        <button> <Link to="/meals">Meal&Calorie Tracker</Link></button>
        <button> <Link to ="/activity">Activity Tracker</Link></button>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/meals" element={<Meals />} />
        <Route path="/activity" element={<Activity />} />
      </Routes>
    </Router>
    </>
    
  )
}
export default App;