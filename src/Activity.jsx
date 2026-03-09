import {useEffect,useState} from "react";
function Activity() {
    const[title,SetTile]=useState("");
    const [description,setDescription]=useState("");
    const[activities,setActivities]=useState(()=>{
        const saved = localStorage.getItem("activities");
        return saved ?JSON.parse(saved) :[];
        });
    useEffect(()=>{
        localStorage.setItem("activities",JSON.stringify(activities))},
        [activities]);

        const addActivity =()=>{
            if( title.trim()===""|| description.trim()==="" ){
                alert("Please fill in all fields.");
                return;
            }
            const newActivity = { 
                id:Date.now(),
                title :title,
                description :description
             };
            setActivities([...activities, newActivity]);
            SetTile("");
            setDescription("");
        }
        const deleteActivities = (id)=>{
        setActivities(prev=>prev.filter(activities=>activities.id !==id))
        }
    
    return (
        <div>
            <h1> Welcome to the Activity Tracker</h1>
            <p>Track your physical activities and workouts here.</p>
        </div>
    );
}
export default Activity;