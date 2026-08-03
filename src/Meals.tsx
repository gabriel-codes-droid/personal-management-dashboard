import { useState, useEffect } from 'react';
import { meals as mealApi, Meal } from './api';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';

const DAILY_TARGET = 2000;
const catColors: Record<string, string> = { breakfast: '#f59e0b', lunch: '#10b981', dinner: '#3b82f6', snack: '#a855f7' };

interface SearchResult {
    name: string;
    calories: number;
}

interface Ingredient {
    name: string;
    calories: number;
}

function Meals() {
    const [meals, setMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'search' | 'manual' | 'dish'>('search');

    const [query, setQuery] = useState('');
    const [manualTitle, setManualTitle] = useState('');
    const [manualCalories, setManualCalories] = useState('');
    const [manualCategory, setManualCategory] = useState('lunch');
    const [dishName, setDishName] = useState('');
    const [ingredientName, setIngredientName] = useState('');
    const [ingredientCalories, setIngredientCalories] = useState('');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

    const reload = async () => {
        try {
            const data = await mealApi.list();
            setMeals(data);
        } catch (e) {
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
                `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8`
            );
            const data = await response.json();
            const results = (data.products || [])
                .filter(p => p.product_name && p.nutriments?.['energy-kcal_100g'])
                .slice(0, 8)
                .map(p => ({
                    name: p.product_name,
                    calories: Math.round(p.nutriments['energy-kcal_100g']),
                }));
            if (results.length === 0) setError('No results found. Try a different name.');
            setSearchResults(results);
        } catch {
            setError('Something went wrong. Check your connection and try again.');
        }
        setLoadingSearch(false);
    };

    const addMealFromSearch = async (meal) => {
        try {
            await mealApi.create({ title: meal.name, calories: meal.calories, category: 'snack', source: 'api' });
            setSearchResults([]);
            setQuery('');
            await reload();
        } catch (e) {
            setError('Failed to add meal.');
        }
    };

    const addMealManually = async () => {
        if (manualTitle.trim() === '' || manualCalories === '') return;
        try {
            await mealApi.create({ title: manualTitle.trim(), calories: Number(manualCalories), category: manualCategory, source: 'manual' });
            setManualTitle('');
            setManualCalories('');
            await reload();
        } catch (e) {
            setError('Failed to add meal.');
        }
    };

    const addIngredient = () => {
        if (ingredientName.trim() === '' || ingredientCalories === '') return;
        setIngredients(prev => [...prev, { name: ingredientName.trim(), calories: Number(ingredientCalories) }]);
        setIngredientName('');
        setIngredientCalories('');
    };

    const addDish = async () => {
        if (dishName.trim() === '' || ingredients.length === 0) return;
        const totalCals = ingredients.reduce((sum, ing) => sum + ing.calories, 0);
        try {
            await mealApi.create({ title: dishName.trim(), calories: totalCals, category: 'dinner', source: 'dish' });
            setDishName('');
            setIngredients([]);
            await reload();
        } catch (e) {
            setError('Failed to add dish.');
        }
    };

    const removeMeal = async (id) => {
        try {
            await mealApi.remove(id);
            await reload();
        } catch (e) {
            setError('Failed to delete meal.');
        }
    };

    const totalCalories = meals.reduce((s, m) => s + Number(m.calories), 0);
    const remaining = Math.max(0, DAILY_TARGET - totalCalories);
    const pct = Math.min(100, (totalCalories / DAILY_TARGET) * 100);

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

            <div className="grid grid-3 mb-md">
                <div className="kpi meals">
                    <div className="kpi-icon">◉</div>
                    <div className="kpi-label">Today</div>
                    <div className="kpi-value">{totalCalories}<span className="muted" style={{ fontSize: 14, fontWeight: 500 }}> kcal</span></div>
                    <div className="progress mt-sm"><div className="progress-bar" style={{ width: pct + '%', background: pct > 100 ? 'var(--danger)' : 'var(--meals)' }} /></div>
                    <div className="kpi-sub muted mt-sm">{pct.toFixed(0)}% of {DAILY_TARGET} goal</div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon">○</div>
                    <div className="kpi-label">Remaining</div>
                    <div className="kpi-value">{remaining}<span className="muted" style={{ fontSize: 14, fontWeight: 500 }}> kcal</span></div>
                    <div className="kpi-sub muted">Until daily target</div>
                </div>
                <div className="kpi accent">
                    <div className="kpi-icon">▦</div>
                    <div className="kpi-label">Logged</div>
                    <div className="kpi-value">{meals.length}</div>
                    <div className="kpi-sub muted">meals today</div>
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
                                    <tr><th>Food</th><th>Calories (per 100g)</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {searchResults.map((r, i) => (
                                        <tr key={i}>
                                            <td style={{ color: 'var(--text-0)', fontWeight: 500 }}>{r.name}</td>
                                            <td className="muted">{r.calories} kcal</td>
                                            <td><button className="btn primary sm" onClick={() => addMealFromSearch(r)}>+ Add</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
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
                            <div className="field" style={{ gridColumn: 'span 3' }}>
                                <label>Dish name</label>
                                <input className="input" placeholder="e.g. Chicken Stew" value={dishName} onChange={e => setDishName(e.target.value)} />
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
                                <tr><th>Meal</th><th>Type</th><th>Calories</th><th style={{ width: 50 }}></th></tr>
                            </thead>
                            <tbody>
                                {meals.map(m => (
                                    <tr key={m._id}>
                                        <td style={{ color: 'var(--text-0)', fontWeight: 500 }}>{m.title}</td>
                                        <td><span className="badge" style={{ background: (catColors[m.category] || '#64748b') + '22', color: catColors[m.category] || '#64748b' }}>{m.category || 'snack'}</span></td>
                                        <td className="muted">{m.calories} kcal</td>
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
                            <ResponsiveContainer>
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
        </div>
    );
}

export default Meals;
