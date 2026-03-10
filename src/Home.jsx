function Home() {
    return(
        <>
        <h2>WELCOME TO YOUR PERSONAL MANAGEMENT DASHBOARD</h2>
        <h3>WHAT PMD(PERSONAL MANAGEMENT DASHBOARD) DOES:</h3>
        <ul>
            <li>At PMD we help you track your income and expenses</li>
            <div className="finance"></div>
            <li>We help you track your daily activities and todo activities</li>
            <div className="activity"></div>
             <li>We also have a meal tracker to help you track your meals and calories</li>
             <div className="meal"></div>
            <li>We also care about your health thus we have a calorie calculator based on our meal tracker</li>
        </ul>
        </>
    )
}
export default Home;