import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { charactersApi } from "../api/characters.js";

const DND_CLASSES = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard", "Artificer"];
const DND_RACES = ["Human", "Elf", "Dwarf", "Halfling", "Gnome", "Half-Elf", "Half-Orc", "Tiefling", "Dragonborn", "Aasimar", "Goliath"];

export default function CharactersPage() {
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", charClass: "Fighter", race: "Human", level: 1 });

    const load = async () => {
        try {
            setLoading(true);
            const data = await charactersApi.list();
            setCharacters(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await charactersApi.create({ ...form, level: Number(form.level) });
            setForm({ name: "", charClass: "Fighter", race: "Human", level: 1 });
            setShowForm(false);
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Borrar este personaje? El acto no se puede deshacer.")) return;
        try {
            await charactersApi.remove(id);
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h1>Mis personajes</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancelar" : "+ Nuevo héroe"}
                </button>
            </div>

            {error && <div className="alert">{error}</div>}

            {showForm && (
                <div className="scroll-card">
                    <h2>Forjar nuevo personaje</h2>
                    <form onSubmit={handleCreate}>
                        <div className="grid grid-2">
                            <div className="field">
                                <label>Nombre</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="field">
                                <label>Clase</label>
                                <select value={form.charClass} onChange={(e) => setForm({ ...form, charClass: e.target.value })}>
                                    {DND_CLASSES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="field">
                                <label>Raza</label>
                                <select value={form.race} onChange={(e) => setForm({ ...form, race: e.target.value })}>
                                    {DND_RACES.map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="field">
                                <label>Nivel</label>
                                <input type="number" min="1" max="20" value={form.level}
                                    onChange={(e) => setForm({ ...form, level: e.target.value })} />
                            </div>
                        </div>
                        <button className="btn btn-primary" type="submit">Crear</button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="loading">Convocando héroes...</div>
            ) : characters.length === 0 ? (
                <div className="empty">No tienes héroes aún. Forja uno arriba.</div>
            ) : (
                <div className="grid grid-2">
                    {characters.map(c => (
                        <div key={c._id} className="scroll-card">
                            <h2 style={{ marginBottom: "0.3rem" }}>{c.name}</h2>
                            <div style={{ marginBottom: "0.8rem" }}>
                                <span className="class-badge">{c.charClass}</span>{" "}
                                <span style={{ color: "var(--ink-faded)" }}>{c.race} • Nv {c.level}</span>
                            </div>
                            <div style={{ display: "flex", gap: "1rem", color: "var(--ink-faded)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                                <span>❤ {c.hitPoints?.current}/{c.hitPoints?.max} PG</span>
                                <span>💰 {c.gold} oro</span>
                                <span>🎒 {c.inventory?.length || 0} items</span>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <Link to={`/characters/${c._id}`} className="btn btn-small">Ver hoja</Link>
                                <button className="btn btn-small btn-danger" onClick={() => handleDelete(c._id)}>Eliminar</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
