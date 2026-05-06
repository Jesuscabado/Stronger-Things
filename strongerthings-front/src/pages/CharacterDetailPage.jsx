import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { charactersApi } from "../api/characters.js";
import { objectsApi } from "../api/objects.js";
import PDFPreviewModal from "../components/PDFPreviewModal.jsx";
import Tabs from "../components/Tabs.jsx";
import GeneralSection from "../components/character/GeneralSection.jsx";
import StatsSection from "../components/character/StatsSection.jsx";
import CombatSection from "../components/character/CombatSection.jsx";
import PersonalitySection from "../components/character/PersonalitySection.jsx";

const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    const [showPreview, setShowPreview] = useState(false);

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

    const updateField = async (fieldOrPayload, value) => {
        const payload = typeof fieldOrPayload === "string"
            ? { [fieldOrPayload]: value }
            : fieldOrPayload;
        try {
            await charactersApi.update(id, payload);
            flash("Guardado");
            load();
        } catch (err) {
            setError(err.message);
        }
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
        } catch (err) { setError(err.message); }
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
        } catch (err) { setError(err.message); }
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

    const generalTab = <GeneralSection character={character} onUpdate={updateField} />;
    const statsTab = <StatsSection character={character} onUpdate={updateField} />;
    const combatTab = <CombatSection character={character} onUpdate={updateField} />;
    const personalityTab = <PersonalitySection character={character} onUpdate={updateField} />;

    const inventoryTab = (
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
    );

    const spellsTab = (
        <div className="scroll-card">
            <div className="tab-placeholder">
                <span className="tab-placeholder-emoji">✨</span>
                <h3>Conjuros</h3>
                <p>Próximamente: aptitud mágica, espacios de conjuro, trucos y hechizos conocidos/preparados.</p>
            </div>
        </div>
    );

    const sheetTab = (
        <div className="scroll-card">
            <h2>📜 Hoja de personaje</h2>
            {character.characterSheet?.filename ? (
                <div>
                    <p style={{ marginBottom: "1rem" }}>
                        <strong>{character.characterSheet.filename}</strong>{" "}
                        <span style={{ color: "var(--ink-faded)" }}>
                            ({formatFileSize(character.characterSheet.size)})
                        </span>
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button className="btn btn-primary" onClick={() => setShowPreview(true)}>
                            👁 Previsualizar
                        </button>
                        <button className="btn btn-gold" onClick={handleDownloadSheet}>⬇ Descargar</button>
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
    );

    const tabs = [
        { id: "general", label: "General", icon: "👤", content: generalTab },
        { id: "stats", label: "Atributos", icon: "💪", content: statsTab },
        { id: "combat", label: "Combate", icon: "⚔", content: combatTab },
        { id: "inventory", label: "Inventario", icon: "🎒", content: inventoryTab },
        { id: "personality", label: "Personalidad", icon: "📖", content: personalityTab },
        { id: "spells", label: "Conjuros", icon: "✨", content: spellsTab },
        { id: "sheet", label: "Hoja PDF", icon: "📜", content: sheetTab }
    ];

    return (
        <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <button className="btn btn-small" onClick={() => navigate("/characters")}>← Volver</button>
                <button
                    className="btn btn-gold"
                    onClick={() => window.open(`/characters/${id}/print`, "_blank")}
                >
                    🖨 Imprimir hoja
                </button>
            </div>

            {error && <div className="alert">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="scroll-card">
                <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                    <div style={{ flexShrink: 0, textAlign: "center" }}>
                        {character.avatar?.cloudinaryUrl ? (
                            <img
                                src={character.avatar.cloudinaryUrl}
                                alt={character.name}
                                style={{
                                    width: "120px", height: "120px", borderRadius: "50%",
                                    objectFit: "cover", border: "3px solid var(--gold)",
                                    boxShadow: "0 4px 8px var(--shadow)"
                                }}
                            />
                        ) : (
                            <div style={{
                                width: "120px", height: "120px", borderRadius: "50%",
                                background: "var(--parchment)", border: "3px dashed var(--parchment-shadow)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "2.5rem", color: "var(--ink-faded)"
                            }}>🧙</div>
                        )}
                        <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                            <label className="btn btn-small">
                                {character.avatar?.cloudinaryUrl ? "Cambiar" : "Subir avatar"}
                                <input type="file" accept="image/*" onChange={handleUploadAvatar} hidden />
                            </label>
                            {character.avatar?.cloudinaryUrl && (
                                <button className="btn btn-small btn-danger" onClick={handleDeleteAvatar}>Eliminar</button>
                            )}
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontFamily: "MedievalSharp", fontSize: "2.5rem", margin: 0 }}>{character.name}</h1>
                        <div style={{ marginBottom: "0.8rem" }}>
                            <span className="class-badge">{character.charClass}</span>{" "}
                            <span style={{ color: "var(--ink-faded)" }}>
                                {character.race} • Nivel {character.level}
                                {character.alignment && ` • ${character.alignment}`}
                            </span>
                        </div>
                        {character.inspiration && (
                            <span style={{
                                display: "inline-block",
                                padding: "0.2rem 0.6rem",
                                background: "var(--gold)",
                                color: "white",
                                borderRadius: "3px",
                                fontSize: "0.8rem",
                                fontFamily: "Cinzel",
                                letterSpacing: "0.5px"
                            }}>✨ INSPIRACIÓN</span>
                        )}
                    </div>
                </div>
            </div>

            <Tabs tabs={tabs} />

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

            {showPreview && character.characterSheet?.cloudinaryUrl && (
                <PDFPreviewModal
                    url={character.characterSheet.cloudinaryUrl}
                    filename={character.characterSheet.filename}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    );
}
