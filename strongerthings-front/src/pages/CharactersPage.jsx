import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { charactersApi } from "../api/characters.js";
import {
    translateClass,
    translateRace,
    CLASS_OPTIONS,
    RACE_OPTIONS
} from "../utils/dndLabels.js";

const emptyForm = { name: "", charClass: "Fighter", race: "Human", level: 1, gold: 0 };

export default function CharactersPage() {
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const navigate = useNavigate();

    const load = async () => {
        try {
            setLoading(true);
            setCharacters(await charactersApi.list());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const startCreate = () => {
        setForm(emptyForm);
        setShowCreate(true);
    };

    const cancelCreate = () => {
        setShowCreate(false);
        setForm(emptyForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...form, level: Number(form.level), gold: Number(form.gold) };
        try {
            const created = await charactersApi.create(payload);
            cancelCreate();
            // Tras crear, llevamos al usuario directo a la página de detalle
            // en modo edición para que termine de definir al personaje.
            if (created?._id) {
                navigate(`/characters/${created._id}?edit=1`);
            } else {
                load();
            }
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
                {!showCreate && (
                    <button className="btn btn-primary" onClick={startCreate}>+ Nuevo héroe</button>
                )}
            </div>

            {error && <div className="alert">{error}</div>}

            {showCreate && (
                <div className="scroll-card">
                    <h2>Forjar nuevo héroe</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-2">
                            <div className="field">
                                <label>Nombre</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div className="field">
                                <label>Clase</label>
                                <select
                                    value={form.charClass}
                                    onChange={(e) => setForm({ ...form, charClass: e.target.value })}
                                >
                                    {CLASS_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>Raza</label>
                                <select
                                    value={form.race}
                                    onChange={(e) => setForm({ ...form, race: e.target.value })}
                                >
                                    {RACE_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>Nivel</label>
                                <input
                                    type="number" min="1" max="20"
                                    value={form.level}
                                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                                />
                            </div>
                            <div className="field">
                                <label>Oro inicial</label>
                                <input
                                    type="number" min="0"
                                    value={form.gold}
                                    onChange={(e) => setForm({ ...form, gold: e.target.value })}
                                />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button type="submit" className="btn btn-primary">Crear</button>
                            <button type="button" className="btn" onClick={cancelCreate}>Cancelar</button>
                        </div>
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
                            <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.8rem" }}>
                                {c.avatar?.cloudinaryUrl ? (
                                    <img
                                        src={c.avatar.cloudinaryUrl}
                                        alt={c.name}
                                        style={{
                                            width: "60px", height: "60px", borderRadius: "50%",
                                            objectFit: "cover", border: "2px solid var(--gold)"
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: "60px", height: "60px", borderRadius: "50%",
                                        background: "var(--parchment)", border: "2px dashed var(--parchment-shadow)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "1.5rem"
                                    }}>
                                        🧙
                                    </div>
                                )}
                                <div>
                                    <h2 style={{ margin: 0, marginBottom: "0.2rem" }}>{c.name}</h2>
                                    <div>
                                        <span className="class-badge">{translateClass(c.charClass)}</span>{" "}
                                        <span style={{ color: "var(--ink-faded)", fontSize: "0.9rem" }}>
                                            {translateRace(c.race)} • Nv {c.level}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "1rem", color: "var(--ink-faded)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                                <span>❤ {c.hitPoints?.current}/{c.hitPoints?.max} PG</span>
                                <span>💰 {c.gold} oro</span>
                                <span>🎒 {c.inventory?.length || 0} objetos</span>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                <Link to={`/characters/${c._id}`} className="btn btn-small">Ver hoja</Link>
                                <Link to={`/characters/${c._id}?edit=1`} className="btn btn-small">Editar</Link>
                                <button className="btn btn-small btn-danger" onClick={() => handleDelete(c._id)}>Eliminar</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}