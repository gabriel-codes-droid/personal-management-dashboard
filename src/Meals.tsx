import { useState, useEffect } from 'react';
import { meals as mealApi, Meal } from './api';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const DAILY_TARGET = 2000;
const catColors: Record<string, string> = { breakfast: '#f59e0b', lunch: '#10b981', dinner: '#3b82f6', snack: '#a855f7' };

interface SearchResult {
    name: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugars?: number;
    sodium?: number;
    barcode?: string;
    brand?: string;
}

interface Ingredient {
    name: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

interface NutritionData {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugars: number;
    sodium: number;
}

function Meals() {
    const [meals, setMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'search' | 'manual' | 'dish' | 'barcode'>('search');

    const [query, setQuery] = useState('');
    const [manualTitle, setManualTitle] = useState('');
    const [manualCalories, setManualCalories] = useState('');
    const [manualProtein, setManualProtein] = useState('');
    const [manualCarbs, setManualCarbs] = useState('');
    const [manualFat, setManualFat] = useState('');
    const [manualCategory, setManualCategory] = useState('lunch');
    const [dishName, setDishName] = useState('');
    const [dishCategory, setDishCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
    const [ingredientName, setIngredientName] = useState('');
    const [ingredientCalories, setIngredientCalories] = useState('');
    const [ingredientProtein, setIngredientProtein] = useState('');
    const [ingredientCarbs, setIngredientCarbs] = useState('');
    const [ingredientFat, setIngredientFat] = useState('');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<SearchResult | null>(null);
    const [barcodeInput, setBarcodeInput] = useState('');

    const reload = async () => {
        try {
            const data = await mealApi.list();
            setMeals(data);
        } catch {
            setError('Failed to load meals.');
        }
    };

    useEffect(() => {
        (async () => {
            await reload();
            setLoading(false);
        })();
    }, []);

    const searchFood = async () => {
        if (query.trim() === '') return;
        setLoadingSearch(true);
        setError('');
        setSearchResults([]);
        try {
            const response = await fetch(
                `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=product_name,nutriments,code,brands`
            );
            const data: { products?: any[] } = await response.json();
            const results = (data.products || [])
                .filter(p => p.product_name && p.nutriments?.['energy-kcal_100g'])
                .slice(0, 8)
                .map(p => ({
                    name: p.product_name,
                    calories: Math.round(p.nutriments['energy-kcal_100g'] || 0),
                    protein: Math.round(p.nutriments?.['proteins_100g'] || 0),
                    carbs: Math.round(p.nutriments?.['carbohydrates_100g'] || 0),
                    fat: Math.round(p.nutriments?.['fat_100g'] || 0),
                    fiber: Math.round(p.nutriments?.['fiber_100g'] || 0),
                    sugars: Math.round(p.nutriments?.['sugars_100g'] || 0),
                    sodium: Math.round(p.nutriments?.['sodium_100g'] || 0),
                    barcode: p.code,
                    brand: p.brands,
                }));
            if (results.length === 0) setError('No results found. Try a different name.');
            setSearchResults(results);
        } catch {
            setError('Something went wrong. Check your connection and try again.');
        }
        setLoadingSearch(false);
    };

    const searchByBarcode = async (barcode: string) => {
        setLoadingSearch(true);
        setError('');
        try {
            const response = await fetch(
                `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
            );
            const data = await response.json();
            if (data.status === 1 && data.product) {
                const p = data.product;
                const result: SearchResult = {
                    name: p.product_name,
                    calories: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
                    protein: Math.round(p.nutriments?.['proteins_100g'] || 0),
                    carbs: Math.round(p.nutriments?.['carbohydrates_100g'] || 0),
                    fat: Math.round(p.nutriments?.['fat_100g'] || 0),
                    fiber: Math.round(p.nutriments?.['fiber_100g'] || 0),
                    sugars: Math.round(p.nutriments?.['sugars_100g'] || 0),
                    sodium: Math.round(p.nutriments?.['sodium_100g'] || 0),
                    barcode: p.code,
                    brand: p.brands,
                };
                setSelectedProduct(result);
                setSearchResults([result]);
            } else {
                setError('Product not found with this barcode.');
            }
        } catch {
            setError('Failed to fetch product data. Check the barcode and try again.');
        }
        setLoadingSearch(false);
    };

    const addMealFromSearch = async (meal: SearchResult) => {
        try {
            await mealApi.create({ 
                title: meal.name, 
                calories: meal.calories, 
                category: 'snack', 
                source: 'api',
                protein: meal.protein,
                carbs: meal.carbs,
                fat: meal.fat,
                fiber: meal.fiber,
                sugars: meal.sugars,
                sodium: meal.sodium,
                barcode: meal.barcode,
                brand: meal.brand
            });
            setSearchResults([]);
            setQuery('');
            setSelectedProduct(null);
            await reload();
        } catch {
            setError('Failed to add meal.');
        }
    };

    const addMealManually = async () => {
        if (manualTitle.trim() === '' || manualCalories === '') return;
        try {
            await mealApi.create({ 
                title: manualTitle.trim(), 
                calories: Number(manualCalories), 
                category: manualCategory as 'breakfast' | 'lunch' | 'dinner' | 'snack', 
                source: 'manual',
                protein: manualProtein ? Number(manualProtein) : undefined,
                carbs: manualCarbs ? Number(manualCarbs) : undefined,
                fat: manualFat ? Number(manualFat) : undefined
            });
            setManualTitle('');
            setManualCalories('');
            setManualProtein('');
            setManualCarbs('');
            setManualFat('');
            await reload();
        } catch {
            setError('Failed to add meal.');
        }
    };

    const addIngredient = () => {
        if (ingredientName.trim() === '' || ingredientCalories === '') return;
        setIngredients(prev => [...prev, { 
            name: ingredientName.trim(), 
            calories: Number(ingredientCalories),
            protein: ingredientProtein ? Number(ingredientProtein) : undefined,
            carbs: ingredientCarbs ? Number(ingredientCarbs) : undefined,
            fat: ingredientFat ? Number(ingredientFat) : undefined
        }]);
        setIngredientName('');
        setIngredientCalories('');
        setIngredientProtein('');
        setIngredientCarbs('');
        setIngredientFat('');
    };

    const addDish = async () => {
        if (dishName.trim() === '' || ingredients.length === 0) return;
        const totalCals = ingredients.reduce((sum, ing) => sum + ing.calories, 0);
        // Aggregate each ingredient's macros — previously these were captured
        // from the form but silently dropped when the dish was saved.
        const totalProtein = ingredients.reduce((sum, ing) => sum + (ing.protein || 0), 0);
        const totalCarbs = ingredients.reduce((sum, ing) => sum + (ing.carbs || 0), 0);
        const totalFat = ingredients.reduce((sum, ing) => sum + (ing.fat || 0), 0);
        try {
            await mealApi.create({
                title: dishName.trim(),
                calories: totalCals,
                category: dishCategory,
                source: 'dish',
                protein: totalProtein || undefined,
                carbs: totalCarbs || undefined,
                fat: totalFat || undefined,
            });
            setDishName('');
            setIngredients([]);
            await reload();
        } catch {
            setError('Failed to add dish.');
        }
    };

    const removeMeal = async (id: string) => {
        try {
            await mealApi.remove(id);
            await reload();
        } catch {
            setError('Failed to delete meal.');
        }
    };

    const totalCalories = meals.reduce((s, m) => s + Number(m.calories), 0);
    const pct = Math.min(100, (totalCalories / DAILY_TARGET) * 100);

    // Calculate total nutrition
    const totalNutrition: NutritionData = meals.reduce((acc, m) => ({
        calories: acc.calories + Number(m.calories),
        protein: acc.protein + (Number(m.protein) || 0),
        carbs: acc.carbs + (Number(m.carbs) || 0),
        fat: acc.fat + (Number(m.fat) || 0),
        fiber: acc.fiber + (Number(m.fiber) || 0),
        sugars: acc.sugars + (Number(m.sugars) || 0),
        sodium: acc.sodium + (Number(m.sodium) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugars: 0, sodium: 0 });

    // Weekly nutrition data for charts
    const last7DaysNutrition = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().slice(0, 10);
        const dayMeals = meals.filter(m => m.createdAt.startsWith(dateStr));
        return {
            day: date.toLocaleDateString(undefined, { weekday: 'short' }),
            calories: dayMeals.reduce((s, m) => s + Number(m.calories), 0),
            protein: dayMeals.reduce((s, m) => s + (Number(m.protein) || 0), 0),
            carbs: dayMeals.reduce((s, m) => s + (Number(m.carbs) || 0), 0),
            fat: dayMeals.reduce((s, m) => s + (Number(m.fat) || 0), 0),
        };
    });

    const cats = ['breakfast', 'lunch', 'dinner', 'snack'];
    const catData = cats.map(c => ({
        name: c.charAt(0).toUpperCase() + c.slice(1),
        value: meals.filter(m => (m.category || 'snack') === c).reduce((s, m) => s + Number(m.calories), 0)
    })).filter(x => x.value > 0);

    if (loading) {
        return (
            <div className="loading-screen" style={{ minHeight: 'auto', padding: 80 }}>
                <div className="spinner" />
                <div>Loading meals...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="section-title">Meal & Calorie Tracker</div>
            <div className="section-sub">Log meals manually, build a dish, or fetch from the OpenFoodFacts API.</div>

            <div className="grid grid-4 mb-md">
                <div className="kpi meals">
                    <div className="kpi-icon">◉</div>
                    <div className="kpi-label">Today</div>
                    <div className="kpi-value">{totalCalories}<span className="muted" style={{ fontSize: 14, fontWeight: 500 }}> kcal</span></div>
                    <div className="progress mt-sm"><div className="progress-bar" style={{ width: pct + '%', background: pct > 100 ? 'var(--danger)' : 'var(--meals)' }} /></div>
                    <div className="kpi-sub muted mt-sm">{pct.toFixed(0)}% of {DAILY_TARGET} goal</div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon">🥩</div>
                    <div className="kpi-label">Protein</div>
                    <div className="kpi-value">{totalNutrition.protein}g</div>
                    <div className="kpi-sub muted">Daily total</div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon">🍞</div>
                    <div className="kpi-label">Carbs</div>
                    <div className="kpi-value">{totalNutrition.carbs}g</div>
                    <div className="kpi-sub muted">Daily total</div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon">🥑</div>
                    <div className="kpi-label">Fat</div>
                    <div className="kpi-value">{totalNutrition.fat}g</div>
                    <div className="kpi-sub muted">Daily total</div>
                </div>
            </div>

            <div className="card mb-md">
                <div className="card-header">
                    <div>
                        <div className="card-title">Add a Meal</div>
                        <div className="card-sub">Three ways to log</div>
                    </div>
                </div>
                <div className="tabs">
                    <button className={'tab ' + (mode === 'search' ? 'active' : '')} onClick={() => setMode('search')}>🔍 Search API</button>
                    <button className={'tab ' + (mode === 'barcode' ? 'active' : '')} onClick={() => setMode('barcode')}>📱 Barcode</button>
                    <button className={'tab ' + (mode === 'manual' ? 'active' : '')} onClick={() => setMode('manual')}>✏️ Manual</button>
                    <button className={'tab ' + (mode === 'dish' ? 'active' : '')} onClick={() => setMode('dish')}>🍽️ Build Dish</button>
                </div>
                {error && <div className="auth-error">{error}</div>}

                {mode === 'search' && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                            <div className="field">
                                <label>Food name</label>
                                <input className="input" placeholder="e.g. banana, chicken breast, oats..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchFood()} />
                            </div>
                            <button className="btn primary" onClick={searchFood} disabled={loadingSearch} style={{ height: 40 }}>
                                {loadingSearch ? 'Searching...' : '🔍 Search'}
                            </button>
                        </div>
                        {searchResults.length > 0 && (
                            <table className="table mt-md">
                                <thead>
                                    <tr><th>Food</th><th>Brand</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Fat</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {searchResults.map((r, i) => (
                                        <tr key={i}>
                                            <td style={{ color: 'var(--text-0)', fontWeight: 500 }}>{r.name}</td>
                                            <td className="muted">{r.brand || '-'}</td>
                                            <td className="muted">{r.calories} kcal</td>
                                            <td className="muted">{r.protein || '-'}g</td>
                                            <td className="muted">{r.carbs || '-'}g</td>
                                            <td className="muted">{r.fat || '-'}g</td>
                                            <td><button className="btn primary sm" onClick={() => addMealFromSearch(r)}>+ Add</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {selectedProduct && (
                            <div className="card mt-md" style={{ background: 'var(--bg-2)', padding: 16 }}>
                                <div className="card-title mb-sm">{selectedProduct.name}</div>
                                {selectedProduct.brand && <div className="muted mb-sm">Brand: {selectedProduct.brand}</div>}
                                <div className="grid grid-4">
                                    <div><strong>Calories:</strong> {selectedProduct.calories} kcal</div>
                                    <div><strong>Protein:</strong> {selectedProduct.protein || '-'}g</div>
                                    <div><strong>Carbs:</strong> {selectedProduct.carbs || '-'}g</div>
                                    <div><strong>Fat:</strong> {selectedProduct.fat || '-'}g</div>
                                </div>
                                {selectedProduct.fiber && <div className="muted mt-sm">Fiber: {selectedProduct.fiber}g</div>}
                                {selectedProduct.sodium && <div className="muted">Sodium: {selectedProduct.sodium}mg</div>}
                                <button className="btn primary mt-sm" onClick={() => addMealFromSearch(selectedProduct)}>Add to Meals</button>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'barcode' && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                            <div className="field">
                                <label>Barcode / EAN</label>
                                <input className="input" placeholder="Enter barcode or scan..." value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchByBarcode(barcodeInput)} />
                            </div>
                            <button className="btn primary" onClick={() => searchByBarcode(barcodeInput)} disabled={loadingSearch} style={{ height: 40 }}>
                                {loadingSearch ? 'Searching...' : '🔍 Lookup'}
                            </button>
                        </div>
                        <div className="muted mt-sm" style={{ fontSize: 12 }}>
                            Enter a product barcode (EAN-13, UPC, etc.) to fetch nutrition data from OpenFoodFacts database.
                        </div>
                    </div>
                )}

                {mode === 'manual' && (
                    <div className="form-row">
                        <div className="field">
                            <label>Meal name</label>
                            <input className="input" placeholder="e.g. Oatmeal with berries" value={manualTitle} onChange={e => setManualTitle(e.target.value)} />
                        </div>
                        <div className="field">
                            <label>Calories</label>
                            <input className="input" type="number" placeholder="kcal" value={manualCalories} onChange={e => setManualCalories(e.target.value)} />
                        </div>
                        <div className="field">
                            <label>Protein (g)</label>
                            <input className="input" type="number" placeholder="optional" value={manualProtein} onChange={e => setManualProtein(e.target.value)} />
                        </div>
                        <div className="field">
                            <label>Carbs (g)</label>
                            <input className="input" type="number" placeholder="optional" value={manualCarbs} onChange={e => setManualCarbs(e.target.value)} />
                        </div>
                        <div className="field">
                            <label>Fat (g)</label>
                            <input className="input" type="number" placeholder="optional" value={manualFat} onChange={e => setManualFat(e.target.value)} />
                        </div>
                        <div className="field">
                            <label>Meal type</label>
                            <select className="select" value={manualCategory} onChange={e => setManualCategory(e.target.value)}>
                                <option value="breakfast">🌅 Breakfast</option>
                                <option value="lunch">☀️ Lunch</option>
                                <option value="dinner">🌙 Dinner</option>
                                <option value="snack">🍪 Snack</option>
                            </select>
                        </div>
                        <div className="field" style={{ justifyContent: 'flex-end' }}>
                            <label>&nbsp;</label>
                            <button className="btn primary" onClick={addMealManually}>Add Meal</button>
                        </div>
                    </div>
                )}

                {mode === 'dish' && (
                    <div>
                        <div className="form-row">
                            <div className="field" style={{ gridColumn: 'span 2' }}>
                                <label>Dish name</label>
                                <input className="input" placeholder="e.g. Chicken Stew" value={dishName} onChange={e => setDishName(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>Meal type</label>
                                <select className="select" value={dishCategory} onChange={e => setDishCategory(e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack')}>
                                    <option value="breakfast">🌅 Breakfast</option>
                                    <option value="lunch">☀️ Lunch</option>
                                    <option value="dinner">🌙 Dinner</option>
                                    <option value="snack">🍪 Snack</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="field" style={{ gridColumn: 'span 2' }}>
                                <label>Ingredient</label>
                                <input className="input" placeholder="e.g. Rice" value={ingredientName} onChange={e => setIngredientName(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>Calories</label>
                                <input className="input" type="number" placeholder="kcal" value={ingredientCalories} onChange={e => setIngredientCalories(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>Protein (g)</label>
                                <input className="input" type="number" placeholder="optional" value={ingredientProtein} onChange={e => setIngredientProtein(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>Carbs (g)</label>
                                <input className="input" type="number" placeholder="optional" value={ingredientCarbs} onChange={e => setIngredientCarbs(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>Fat (g)</label>
                                <input className="input" type="number" placeholder="optional" value={ingredientFat} onChange={e => setIngredientFat(e.target.value)} />
                            </div>
                            <div className="field" style={{ justifyContent: 'flex-end' }}>
                                <label>&nbsp;</label>
                                <button className="btn ghost" onClick={addIngredient}>+ Add Ingredient</button>
                            </div>
                        </div>

                        {ingredients.length > 0 && (
                            <div className="card mt-md" style={{ background: 'var(--bg-2)', padding: 12 }}>
                                <div className="row between mb-sm">
                                    <div className="card-title">Ingredients</div>
                                    <span className="badge info">{ingredients.reduce((s, i) => s + i.calories, 0)} kcal total</span>
                                </div>
                                <table className="table">
                                    <tbody>
                                        {ingredients.map((ing, i) => (
                                            <tr key={i}>
                                                <td style={{ color: 'var(--text-0)' }}>{ing.name}</td>
                                                <td className="muted">{ing.calories} kcal</td>
                                                <td><button className="btn ghost sm" onClick={() => setIngredients(p => p.filter((_, idx) => idx !== i))}>✕</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button className="btn primary mt-sm" onClick={addDish} style={{ width: '100%' }}>Save Dish</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-2-1 mb-md">
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Today's Meals</div>
                            <div className="card-sub">{meals.length} entries</div>
                        </div>
                    </div>
                    {meals.length === 0 ? (
                        <div className="empty"><div className="empty-icon">○</div>No meals yet. Add one above.</div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr><th>Meal</th><th>Type</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Fat</th><th style={{ width: 50 }}></th></tr>
                            </thead>
                            <tbody>
                                {meals.map(m => (
                                    <tr key={m._id}>
                                        <td style={{ color: 'var(--text-0)', fontWeight: 500 }}>{m.title}</td>
                                        <td><span className="badge" style={{ background: (catColors[m.category] || '#64748b') + '22', color: catColors[m.category] || '#64748b' }}>{m.category || 'snack'}</span></td>
                                        <td className="muted">{m.calories} kcal</td>
                                        <td className="muted">{m.protein || '-'}g</td>
                                        <td className="muted">{m.carbs || '-'}g</td>
                                        <td className="muted">{m.fat || '-'}g</td>
                                        <td><button className="btn ghost sm" onClick={() => removeMeal(m._id)}>✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Distribution</div>
                            <div className="card-sub">By meal type</div>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 240 }}>
                        {catData.length === 0 ? (
                            <div className="empty"><div className="empty-icon">○</div>No data yet.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                                        {catData.map((d, i) => <Cell key={i} fill={catColors[d.name.toLowerCase()]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div className="row" style={{ justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                        {catData.map(d => (
                            <div key={d.name} className="row" style={{ gap: 6, fontSize: 12 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 2, background: catColors[d.name.toLowerCase()] }} />
                                <span className="muted">{d.name} · {d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card mb-md">
                <div className="card-header">
                    <div>
                        <div className="card-title">Weekly Nutrition Overview</div>
                        <div className="card-sub">Last 7 days tracking</div>
                    </div>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={last7DaysNutrition}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#232938" />
                            <XAxis dataKey="day" stroke="#5b6377" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#5b6377" tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="calories" fill="#f97316" name="Calories" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="protein" fill="#10b981" name="Protein (g)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="carbs" fill="#3b82f6" name="Carbs (g)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="fat" fill="#a855f7" name="Fat (g)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default Meals;
