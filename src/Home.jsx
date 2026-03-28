import './App.css';
function Home() {

    return(
        <>
        <h2>WELCOME TO YOUR PERSONAL MANAGEMENT DASHBOARD</h2>
        <h3>WHAT PMD(PERSONAL MANAGEMENT DASHBOARD) DOES:</h3>
        <div>
            <div className="finance">At PMD we help you track your income and expenses</div>
            
            <div className="activity">We help you track your daily activities and todo activities</div>
           
             <div className="meal">We also have a meal tracker to help you track your meals and calories<p>We also care about your health thus we have a calorie calculator based on our meal tracker</p></div>
            
            
        </div>
        </>
    )
}

export default Home;