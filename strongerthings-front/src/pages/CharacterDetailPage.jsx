import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { charactersApi } from "../api/characters.js";
import { objectsApi } from "../api/objects.js";

const mod = (score) => Math.floor((score - 10) / 2);
const formatMod = (score) => {
    const m = mod(score);
    return m >= 0 ? `+${m}` : `${m}`;
};

export default function CharacterDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [character, setCharacter] = useState(null);
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showAddItem, setShowAddItem] = useState(false);
    const [newItem, setNewItem] = useState({ baseObject: "", customName: "", quantity: 1, durability: 100 });
    const [editingItem, setEditingItem] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            const [charData, catData] = await Promise.all([
                charactersApi.get(id),
                objectsApi.list()
            ]);
            setCharacter(charData);
            setCatalog(catData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    const flash = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(""), 2500);
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            await charactersApi.addItem(id, {
                baseObject: newItem.baseObject,
                customName: newItem.customName || undefined,
                quantity: Number(newItem.quantity),
                durability: Number(newItem.durability)
            });
            setNewItem({ baseObject: "", customName: "", quantity: 1, durability: 100 });
            setShowAddItem(false);
            flash("Item añadido");
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleToggleEquipped = async (itemId, current) => {
        try {
            await charactersApi.updateItem(id, itemId, { equipped: !current });
            load();
        } catch (err) { setError(err.message); }
    };

    const handleUpdateDurability = async (itemId, newValue) => {
        try {
            await charactersApi.updateItem(id, itemId, { durability: Number(newValue) });
            load();
        } catch (err) { setError(err.message); }
    };

    const handleDeleteItem = async (itemId) => {
        if (!confirm("¿Dropear este item?")) return;
        try {
            await charactersApi.removeItem(id, itemId);
            flash("Item eliminado");
            load();
        } catch (err) { setError(err.message); }
    };

    const handleSaveItemEdit = async (e) => {
        e.preventDefault();
        try {
            await charactersApi.updateItem(id, editingItem._id, {
                customName: editingItem.customName || "",
                quantity: Number(editingItem.quantity),
                durability: Number(editingItem.durability),
                equipped: editingItem.equipped,
                notes: editingItem.notes || ""
            });
            setEditingItem(null);
            flash("Item actualizado");
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    const updateField = async (field, value) => {
        try {
            await charactersApi.update(id, { [field]: value });
            flash("Guardado");
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUploadSheet = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            await charactersApi.uploadSheet(id, file);
            flash("Hoja de personaje subida");
            load();
        } catch (err) { setError(err.message); }
    };

    const handleDownloadSheet = async () => {
        try {
            const blob = await charactersApi.downloadSheet(id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = character.characterSheet?.filename || "character-sheet.pdf";
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) { setError(err.message); }
    };

    const handleDeleteSheet = async () => {
        if (!confirm("¿Eliminar la hoja de personaje?")) return;
        try {
            await charactersApi.deleteSheet(id);
            flash("Hoja eliminada");
            load();
        } catch (err) { setError(err.message); }
    };

    const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        await charactersApi.uploadAvatar(id, file);
        flash("Avatar actualizado");
        load();
    } catch (err) { setError(err.message); }
};

const handleDeleteAvatar = async () => {
    if (!confirm("¿Eliminar el avatar?")) return;
    try {
        await charactersApi.deleteAvatar(id);
        flash("Avatar eliminado");
        load();
    } catch (err) { setError(err.message); }
};

    if (loading) return <div className="loading">Consultando los pergaminos...</div>;
    if (!character) return <div className="container"><div className="alert">{error || "Personaje no encontrado"}</div></div>;

    const stats = character.abilityScores || {};

    return (
        <div className="container">
            <button className="btn btn-small" onClick={() => navigate("/characters")} style={{ marginBottom: "1rem" }}>← Volver</button>

            {error && <div className="alert">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="scroll-card">
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
        {/* Avatar a la izquierda */}
        <div style={{ flexShrink: 0, textAlign: "center" }}>
            {character.avatar?.cloudinaryUrl ? (
                <img
                    src={character.avatar.cloudinaryUrl}
                    alt={character.name}
                    style={{
                        width: "150px",
                        height: "150px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "3px solid var(--gold)",
                        boxShadow: "0 4px 8px var(--shadow)"
                    }}
                />
            ) : (
                <div style={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    background: "var(--parchment)",
                    border: "3px dashed var(--parchment-shadow)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "3rem",
                    color: "var(--ink-faded)"
                }}>
                    🧙
                </div>
            )}
            <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label className="btn btn-small">
                    {character.avatar?.cloudinaryUrl ? "Cambiar" : "Subir avatar"}
                    <input type="file" accept="image/*" onChange={handleUploadAvatar} hidden />
                </label>
                {character.avatar?.cloudinaryUrl && (
                    <button className="btn btn-small btn-danger" onClick={handleDeleteAvatar}>
                        Eliminar
                    </button>
                )}
            </div>
        </div>

        {/* Info a la derecha */}
        <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: "MedievalSharp", fontSize: "3rem", margin: 0 }}>{character.name}</h1>
            <div style={{ marginBottom: "1rem" }}>
                <span className="class-badge">{character.charClass}</span>{" "}
                <span style={{ color: "var(--ink-faded)" }}>{character.race} • Nivel {character.level}</span>
            </div>
            <div style={{ display: "flex", gap: "2rem", fontSize: "1.1rem", flexWrap: "wrap" }}>
                <span>
                    ❤ <EditableNumber
                        value={character.hitPoints?.current ?? 0}
                        onSave={(v) => updateField("hitPoints", { ...character.hitPoints, current: v })}
                        min={0}
                    />/<EditableNumber
                        value={character.hitPoints?.max ?? 0}
                        onSave={(v) => updateField("hitPoints", { ...character.hitPoints, max: v })}
                        min={1}
                    /> PG
                </span>
                <span>
                    💰 <EditableNumber
                        value={character.gold ?? 0}
                        onSave={(v) => updateField("gold", v)}
                        min={0}
                    /> oro
                </span>
                <span>
                    🎖 Nv <EditableNumber
                        value={character.level ?? 1}
                        onSave={(v) => updateField("level", v)}
                        min={1}
                        max={20}
                    />
                </span>
            </div>
            <p style={{ marginTop: "0.8rem", fontSize: "0.85rem", color: "var(--ink-faded)" }}>
                💡 Click en los números para editarlos.
            </p>
        </div>
    </div>
</div>

            <div className="scroll-card">
                <h2>Características</h2>
                <div className="stats-grid">
                    {[
                        ["FUE", "strength", stats.strength],
                        ["DES", "dexterity", stats.dexterity],
                        ["CON", "constitution", stats.constitution],
                        ["INT", "intelligence", stats.intelligence],
                        ["SAB", "wisdom", stats.wisdom],
                        ["CAR", "charisma", stats.charisma]
                    ].map(([label, key, value]) => (
                        <div key={label} className="stat">
                            <div className="stat__label">{label}</div>
                            <div className="stat__value">
                                <EditableNumber
                                    value={value ?? 10}
                                    onSave={(v) => updateField("abilityScores", { ...stats, [key]: v })}
                                    min={1}
                                    max={30}
                                />
                            </div>
                            <div className="stat__mod">{formatMod(value ?? 10)}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="scroll-card">
                <h2>📜 Hoja de personaje</h2>
                {character.characterSheet?.filename ? (
                    <div>
                        <p style={{ marginBottom: "1rem" }}>
                            <strong>{character.characterSheet.filename}</strong>{" "}
                            <span style={{ color: "var(--ink-faded)" }}>
                                ({Math.round(character.characterSheet.size / 1024)} KB)
                            </span>
                        </p>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button className="btn btn-gold" onClick={handleDownloadSheet}>⬇ Descargar</button>
                            {character.characterSheet.driveLink && (
                                <a className="btn" href={character.characterSheet.driveLink} target="_blank" rel="noopener">
                                    Ver en Drive
                                </a>
                            )}
                            <button className="btn btn-danger btn-small" onClick={handleDeleteSheet}>Eliminar</button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p style={{ marginBottom: "1rem", color: "var(--ink-faded)" }}>
                            Sube tu hoja de personaje en PDF (máx 50MB).
                        </p>
                        <label className="btn btn-primary">
                            Subir PDF
                            <input type="file" accept="application/pdf" onChange={handleUploadSheet} hidden />
                        </label>
                    </div>
                )}
            </div>

            <div className="scroll-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 style={{ margin: 0 }}>🎒 Inventario</h2>
                    <button className="btn btn-small btn-primary" onClick={() => setShowAddItem(!showAddItem)}>
                        {showAddItem ? "Cancelar" : "+ Añadir item"}
                    </button>
                </div>

                {showAddItem && (
                    <form onSubmit={handleAddItem} style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--parchment)", border: "1px dashed var(--parchment-shadow)" }}>
                        <div className="grid grid-2">
                            <div className="field">
                                <label>Objeto del catálogo</label>
                                <select value={newItem.baseObject} onChange={(e) => setNewItem({ ...newItem, baseObject: e.target.value })} required>
                                    <option value="">— Selecciona —</option>
                                    {catalog.map(o => <option key={o._id} value={o._id}>{o.name} ({o.category})</option>)}
                                </select>
                            </div>
                            <div className="field">
                                <label>Nombre personalizado (opcional)</label>
                                <input value={newItem.customName} onChange={(e) => setNewItem({ ...newItem, customName: e.target.value })} placeholder="Andúril" />
                            </div>
                            <div className="field">
                                <label>Cantidad</label>
                                <input type="number" min="1" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>Durabilidad</label>
                                <input type="number" min="0" max="100" value={newItem.durability} onChange={(e) => setNewItem({ ...newItem, durability: e.target.value })} />
                            </div>
                        </div>
                        <button className="btn btn-primary btn-small" type="submit">Añadir al inventario</button>
                    </form>
                )}

                {!character.inventory || character.inventory.length === 0 ? (
                    <div className="empty">Las alforjas están vacías.</div>
                ) : (
                    <ul className="inventory-list">
                        {character.inventory.map(item => (
                            <li key={item._id} className="inventory-item">
                                <div>
                                    <div className="inventory-item__name">
                                        {item.customName ? (
                                            <>
                                                <span className="inventory-item__custom">{item.customName}</span>
                                                <span style={{ color: "var(--ink-faded)", fontSize: "0.9rem" }}> ({item.baseObject?.name})</span>
                                            </>
                                        ) : item.baseObject?.name}
                                        {item.equipped && <span className="equipped-badge" style={{ marginLeft: "0.5rem" }}>equipada</span>}
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--ink-faded)" }}>
                                        {item.baseObject?.category}
                                        {item.baseObject?.stats?.damage && ` • ${item.baseObject.stats.damage} ${item.baseObject.stats.damageType}`}
                                        {item.baseObject?.stats?.armorClass && ` • CA ${item.baseObject.stats.armorClass}`}
                                        {item.quantity > 1 && ` • x${item.quantity}`}
                                    </div>
                                    {item.notes && (
                                        <div style={{ fontSize: "0.8rem", color: "var(--ink-faded)", fontStyle: "italic", marginTop: "0.2rem" }}>
                                            "{item.notes}"
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                                    <input
                                        type="range" min="0" max="100" value={item.durability ?? 100}
                                        onChange={(e) => handleUpdateDurability(item._id, e.target.value)}
                                        style={{ width: "100px" }}
                                    />
                                    <span style={{ fontSize: "0.75rem", color: "var(--ink-faded)" }}>
                                        {item.durability ?? 100}/100
                                    </span>
                                </div>

                                <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                                    <button className="btn btn-small" onClick={() => handleToggleEquipped(item._id, item.equipped)}>
                                        {item.equipped ? "Desequipar" : "Equipar"}
                                    </button>
                                    <button className="btn btn-small" onClick={() => setEditingItem({ ...item })}>
                                        Editar
                                    </button>
                                </div>
                                <button className="btn btn-small btn-danger" onClick={() => handleDeleteItem(item._id)}>×</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {editingItem && (
                <div className="modal-overlay" onClick={() => setEditingItem(null)}>
                    <div className="modal-content" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setEditingItem(null)}>×</button>
                        <h2>Editar item</h2>
                        <p style={{ color: "var(--ink-faded)", marginBottom: "1rem" }}>
                            <strong>{editingItem.baseObject?.name}</strong>
                        </p>
                        <form onSubmit={handleSaveItemEdit}>
                            <div className="field">
                                <label>Nombre personalizado</label>
                                <input
                                    value={editingItem.customName || ""}
                                    onChange={(e) => setEditingItem({ ...editingItem, customName: e.target.value })}
                                    placeholder="Andúril, Llama del Oeste"
                                />
                            </div>
                            <div className="grid grid-2">
                                <div className="field">
                                    <label>Cantidad</label>
                                    <input type="number" min="1" value={editingItem.quantity}
                                        onChange={(e) => setEditingItem({ ...editingItem, quantity: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label>Durabilidad</label>
                                    <input type="number" min="0" max="100" value={editingItem.durability ?? 100}
                                        onChange={(e) => setEditingItem({ ...editingItem, durability: e.target.value })} />
                                </div>
                            </div>
                            <div className="field">
                                <label>
                                    <input type="checkbox" checked={!!editingItem.equipped}
                                        onChange={(e) => setEditingItem({ ...editingItem, equipped: e.target.checked })}
                                        style={{ width: "auto", marginRight: "0.5rem" }} />
                                    Equipada
                                </label>
                            </div>
                            <div className="field">
                                <label>Notas</label>
                                <textarea rows="2" value={editingItem.notes || ""}
                                    onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                                    placeholder="Reforjada de los fragmentos de Narsil..." />
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button className="btn btn-primary" type="submit">Guardar</button>
                                <button type="button" className="btn" onClick={() => setEditingItem(null)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function EditableNumber({ value, onSave, min, max }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    useEffect(() => { setDraft(value); }, [value]);

    const commit = () => {
        const n = Number(draft);
        if (!Number.isFinite(n) || n === value) {
            setEditing(false);
            setDraft(value);
            return;
        }
        if (min != null && n < min) { setDraft(value); setEditing(false); return; }
        if (max != null && n > max) { setDraft(value); setEditing(false); return; }
        onSave(n);
        setEditing(false);
    };

    if (!editing) {
        return (
            <strong onClick={() => setEditing(true)} style={{ cursor: "pointer", borderBottom: "1px dotted var(--ink-faded)" }}>
                {value}
            </strong>
        );
    }

    return (
        <input
            type="number"
            autoFocus
            min={min}
            max={max}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
            style={{ width: "70px", display: "inline-block", padding: "0.1rem 0.3rem", fontSize: "1rem" }}
        />
    );
}