 
 import './App.css';
import {useEffect,useState} from "react";
function Activity() {
    const[title,setTitle]=useState(""); 
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
            setTitle("");
            setDescription("");
        }
        const deleteActivities = (id)=>{
        setActivities(prev=>prev.filter(activities=>activities.id !==id))
        }
    
    return (
        <div>
            <h3> Welcome to the Activity Tracker</h3>
            <p>Track your physical activities and workouts here.</p>
            <input
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            placeholder="Activity Title"
            />
            <input
            value={description}
            onChange={(e)=>setDescription(e.target.value)}
            placeholder="Activity Description"
            />
            <button onClick={addActivity}>Add Activity</button>
            <ul>
                {activities.map(activity=>(
                   <li key={activity.id}>
                    {activity.title} :{activity.description}
                    <button onClick={() => deleteActivities(activity.id)}>Delete</button>
                   </li>)


                )}
            </ul>
        </div>
    );
}
export default Activity;