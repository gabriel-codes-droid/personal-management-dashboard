import { useEffect,useState } from 'react';
import './App.css';
function Meals(){
    const[title,setTitle]=useState("");
    const[calories,setCalories]=useState("");
    const[meals,setMeals]=useState(()=>{
    const saved = localStorage.getItem("meals");
    return saved ?JSON.parse(saved) :[];
    });
    useEffect(()=>{
        localStorage.setItem("meals",JSON.stringify(meals))
    },[meals]);

    const addMeal =()=>{
        if(title.trim()===""|| calories.trim()===""){
            alert("please fill in these fields")
            return;
        } 
         const newMeal={
        id:Date.now(),
        title:title,
        calories:calories
    }
    setMeals([...meals, newMeal]);
    setTitle("");
    setCalories("");
    
    }
    const deleteMeal =(id)=>{
        setMeals(prev=>prev.filter(meals=>meals.id!==id))
    }
  

    return(
        <>
        <h3>Hi this is our meal tracker:</h3>
        <input
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
        placeholder="Meal name"
         />
         <br/>
         <input
         type="number"
        value={calories}
        onChange={(e)=>setCalories(e.target.value)}
        placeholder="Number"
         />
         <br/>
         <button onClick={addMeal}>Add a Meal</button>
        <ul>
           {meals.map(meal=>(
            <li key={meal.id}>
                {meal.title} :{meal.calories}
                <button onClick={() => deleteMeal(meal.id)}>Delete this Meal</button>
                   
            </li>)
           )}
        </ul>



        </> 
    );
}
export default Meals;