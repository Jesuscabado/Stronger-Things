import { useEffect, useState } from "react";
import { objectsApi } from "../api/objects.js";
import { translateCategory } from "../utils/categoryLabels.js";

const CATEGORIES = ["weapon", "armor", "shield", "potion", "scroll", "wondrous", "tool", "gear", "ammunition"];
const RARITIES = ["common", "uncommon", "rare", "very rare", "legendary", "artifact"];

const RARITY_LABELS = {
    common:      "Común",
    uncommon:    "Poco común",
    rare:        "Raro",
    "very rare": "Muy raro",
    legendary:   "Legendario",
    artifact:    "Artefacto"
};

const translateRarity = (en) => RARITY_LABELS[en?.toLowerCase()] || en || "Común";

const rarityColor = {
    common: "#666",
    uncommon: "#1eb7b7",
    rare: "#3b6dff",
    "very rare": "#a347c4",
    legendary: "#e08000",
    artifact: "#a02020"
};

export default function ObjectsPage() {
    const [objects, setObjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState("all");
    // Búsqueda por nombre. El catálogo se filtra en cliente, no se llama
    // al servidor: el listado ya vive en memoria desde la carga inicial.
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({
        name: "", description: "", category: "weapon", cost: 0,
        damage: "", damageType: "", armorClass: "", weight: 0, rarity: "common"
    });

    const load = async () => {
        try {
            setLoading(true);
            const data = await objectsApi.list();
            setObjects(data);
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
            const stats = { rarity: form.rarity, weight: Number(form.weight) || 0 };
            if (form.damage) stats.damage = form.damage;
            if (form.damageType) stats.damageType = form.damageType;
            if (form.armorClass) stats.armorClass = Number(form.armorClass);

            await objectsApi.create({
                name: form.name,
                description: form.description,
                category: form.category,
                cost: Number(form.cost) || 0,
                stats
            });
            setForm({ name: "", description: "", category: "weapon", cost: 0, damage: "", damageType: "", armorClass: "", weight: 0, rarity: "common" });
            setShowForm(false);
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    // Filtrado combinado: categoría + texto de búsqueda.
    // La búsqueda es case-insensitive y se aplica al nombre del objeto.
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = objects.filter(o => {
        const matchesCategory = filter === "all" || o.category === filter;
        const matchesSearch = !normalizedSearch ||
            (o.name || "").toLowerCase().includes(normalizedSearch);
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <h1>Catálogo de objetos</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancelar" : "+ Nuevo objeto"}
                </button>
            </div>

            {error && <div className="alert">{error}</div>}

            {showForm && (
                <div className="scroll-card">
                    <h2>Forjar objeto</h2>
                    <form onSubmit={handleCreate}>
                        <div className="grid grid-2">
                            <div className="field">
                                <label>Nombre</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="field">
                                <label>Categoría</label>
                                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{translateCategory(c)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field" style={{ gridColumn: "1 / -1" }}>
                                <label>Descripción</label>
                                <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>Coste (oro)</label>
                                <input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>Peso (lb)</label>
                                <input type="number" min="0" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>Daño (ej: 1d8)</label>
                                <input value={form.damage} onChange={(e) => setForm({ ...form, damage: e.target.value })} placeholder="1d8" />
                            </div>
                            <div className="field">
                                <label>Tipo daño</label>
                                <input value={form.damageType} onChange={(e) => setForm({ ...form, damageType: e.target.value })} placeholder="cortante" />
                            </div>
                            <div className="field">
                                <label>CA (armadura)</label>
                                <input type="number" value={form.armorClass} onChange={(e) => setForm({ ...form, armorClass: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>Rareza</label>
                                <select value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })}>
                                    {RARITIES.map(r => (
                                        <option key={r} value={r}>{translateRarity(r)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button className="btn btn-primary" type="submit">Crear</button>
                    </form>
                </div>
            )}

            {/*
                Barra de búsqueda. Envuelta en <form> para heredar los estilos
                globales de inputs (font Garamond, fondo crema, borde dorado
                en focus). El submit se neutraliza porque el filtrado es en vivo.
            */}
            <form
                className="scroll-card"
                onSubmit={(e) => e.preventDefault()}
                style={{ padding: "1rem 1.5rem", marginBottom: "1rem" }}
            >
                <div className="field" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                    <label style={{ marginBottom: 0, flexShrink: 0 }}>🔍 Buscar</label>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Nombre del objeto..."
                        style={{ flex: 1, minWidth: "200px" }}
                    />
                    {search && (
                        <button
                            type="button"
                            className="btn btn-small"
                            onClick={() => setSearch("")}
                            title="Limpiar búsqueda"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </form>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <button className={`btn btn-small ${filter === "all" ? "btn-gold" : ""}`} onClick={() => setFilter("all")}>Todos</button>
                {CATEGORIES.map(c => (
                    <button
                        key={c}
                        className={`btn btn-small ${filter === c ? "btn-gold" : ""}`}
                        onClick={() => setFilter(c)}
                    >
                        {translateCategory(c)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading">Hojeando los grimorios...</div>
            ) : filtered.length === 0 ? (
                <div className="empty">
                    {normalizedSearch
                        ? `No hay objetos que coincidan con "${search}".`
                        : "No hay objetos en esta categoría."}
                </div>
            ) : (
                <>
                    {/* Contador discreto que confirma cuántos resultados se ven */}
                    <p style={{ color: "var(--ink-faded)", fontSize: "0.9rem", margin: "0 0 1rem" }}>
                        Mostrando {filtered.length} de {objects.length} objetos
                    </p>
                    <div className="grid grid-3">
                        {filtered.map(o => (
                            <div key={o._id} className="scroll-card">
                                <h3 style={{ marginBottom: "0.3rem" }}>{o.name}</h3>
                                <div style={{ marginBottom: "0.5rem" }}>
                                    <span className="class-badge" style={{ color: rarityColor[o.stats?.rarity] }}>
                                        {translateRarity(o.stats?.rarity)}
                                    </span>{" "}
                                    <span style={{ color: "var(--ink-faded)", fontSize: "0.85rem" }}>
                                        {translateCategory(o.category)}
                                    </span>
                                </div>
                                {o.description && <p style={{ fontSize: "0.9rem", marginBottom: "0.6rem" }}>{o.description}</p>}
                                <div style={{ fontSize: "0.85rem", color: "var(--ink-faded)" }}>
                                    {o.stats?.damage && <div>⚔ {o.stats.damage} {o.stats.damageType}</div>}
                                    {o.stats?.armorClass && <div>🛡 CA {o.stats.armorClass}</div>}
                                    {o.cost > 0 && <div>💰 {o.cost} oro</div>}
                                    {o.stats?.weight > 0 && <div>⚖ {o.stats.weight} lb</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}