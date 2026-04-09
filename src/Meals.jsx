import { useEffect, useState } from 'react';
import ConfirmModal from "./ConfirmModal";
import Toast from "./Toast";
import useDeleteWithUndo from "./useDeleteWithUndo";

function Meals() {
    const [query, setQuery] = useState("");
    const [meals, setMeals] = useState(() => {
        const saved = localStorage.getItem("meals");
        return saved ? JSON.parse(saved) : [];
    });
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mode, setMode] = useState("search");
    const [manualTitle, setManualTitle] = useState("");
    const [manualCalories, setManualCalories] = useState("");
    const [dishName, setDishName] = useState("");
    const [ingredientName, setIngredientName] = useState("");
    const [ingredientCalories, setIngredientCalories] = useState("");
    const [ingredients, setIngredients] = useState([]);

    const { deletedItem, showToast, triggerDelete, confirmDelete, undoDelete, setDeletedItem } = useDeleteWithUndo();

    useEffect(() => {
        localStorage.setItem("meals", JSON.stringify(meals));
    }, [meals]);

    const searchFood = async () => {
        if (query.trim() === "") return;
        setLoading(true);
        setError("");
        setSearchResults([]);
        try {
            const response = await fetch(
                `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=5`
            );
            const data = await response.json();
            const results = data.products
                .filter(p => p.product_name && p.nutriments?.["energy-kcal_100g"])
                .map(p => ({
                    id: Date.now() + Math.random(),
                    name: p.product_name,
                    calories: Math.round(p.nutriments["energy-kcal_100g"])
                }));
            if (results.length === 0) setError("No results found, try a different name");
            setSearchResults(results);
        } catch {
            setError("Something went wrong, try again");
        }
        setLoading(false);
    };

    const addMealFromSearch = (meal) => {
        setMeals(prev => [...prev, { id: Date.now(), title: meal.name, calories: meal.calories }]);
        setSearchResults([]);
        setQuery("");
    };

    const addMealManually = () => {
        if (manualTitle.trim() === "" || manualCalories === "") {
            alert("Please fill in both fields");
            return;
        }
        setMeals(prev => [...prev, { id: Date.now(), title: manualTitle, calories: Number(manualCalories) }]);
        setManualTitle("");
        setManualCalories("");
    };

    const addIngredient = () => {
        if (ingredientName.trim() === "" || ingredientCalories === "") {
            alert("Please fill in both ingredient fields");
            return;
        }
        setIngredients(prev => [...prev, { name: ingredientName, calories: Number(ingredientCalories) }]);
        setIngredientName("");
        setIngredientCalories("");
    };

    const addDish = () => {
        if (dishName.trim() === "" || ingredients.length === 0) {
            alert("Please enter a dish name and at least one ingredient");
            return;
        }
        const totalCals = ingredients.reduce((sum, ing) => sum + ing.calories, 0);
        setMeals(prev => [...prev, { id: Date.now(), title: dishName, calories: totalCals }]);
        setDishName("");
        setIngredients([]);
    };

    const totalCalories = meals.reduce((total, meal) => total + Number(meal.calories), 0);

    return (
        <div className="page-container">
            <ConfirmModal
                item={deletedItem?.item}
                onConfirm={() => confirmDelete(meals, setMeals)}
                onCancel={() => setDeletedItem(null)}
            />
            <Toast
                show={showToast}
                message="Meal deleted"
                onUndo={() => undoDelete(meals, setMeals)}
            />

            <h2>PMD Meal & Calorie Tracker</h2>
            <h3>Total Calories: {totalCalories} kcal</h3>

            <div className="form-group">
                <select className="mode-select" value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option value="search">🔍 Search Food API</option>
                    <option value="manual">✏️ Add Manually</option>
                    <option value="dish">🍽️ Build a Dish</option>
                </select>
            </div>

            {mode === "search" && (
                <div className="form-group">
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for a meal..." onKeyDown={(e) => e.key === "Enter" && searchFood()} />
                    <button onClick={searchFood}>Search</button>
                    {loading && <p style={{ color: "#646cff" }}>Searching...</p>}
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    {searchResults.length > 0 && (
                        <ul className="search-results">
                            {searchResults.map((result, index) => (
                                <li key={index}>
                                    {result.name} — {result.calories} kcal/100g
                                    <button onClick={() => addMealFromSearch(result)}>Add</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {mode === "manual" && (
                <div className="form-group">
                    <input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="Meal name" />
                    <input type="number" value={manualCalories} onChange={(e) => setManualCalories(e.target.value)} placeholder="Calories (kcal)" />
                    <button onClick={addMealManually}>Add Meal</button>
                </div>
            )}

            {mode === "dish" && (
                <div className="form-group">
                    <input value={dishName} onChange={(e) => setDishName(e.target.value)} placeholder="Dish name e.g. Chicken Stew" />
                    <hr style={{ width: "100%", borderColor: "#333" }} />
                    <input value={ingredientName} onChange={(e) => setIngredientName(e.target.value)} placeholder="Ingredient name" />
                    <input type="number" value={ingredientCalories} onChange={(e) => setIngredientCalories(e.target.value)} placeholder="Ingredient calories (kcal)" />
                    <button onClick={addIngredient}>Add Ingredient</button>
                    {ingredients.length > 0 && (
                        <ul className="search-results">
                            {ingredients.map((ing, index) => (
                                <li key={index}>
                                    {ing.name} — {ing.calories} kcal
                                    <button onClick={() => setIngredients(prev => prev.filter((_, i) => i !== index))}>Remove</button>
                                </li>
                            ))}
                            <li style={{ fontWeight: "bold" }}>Total: {ingredients.reduce((sum, ing) => sum + ing.calories, 0)} kcal</li>
                        </ul>
                    )}
                    <button onClick={addDish}>Add Dish to Meals</button>
                </div>
            )}

            <h3>My Meals:</h3>
            <ul className="meals-list">
                {meals.map(meal => (
                    <li key={meal.id}>
                        {meal.title} : {meal.calories} kcal
                        <button onClick={() => triggerDelete(meal)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
export default Meals;