import { useState } from "react";

const DND_CLASSES = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard", "Artificer"];
const DND_RACES = ["Human", "Elf", "Dwarf", "Halfling", "Gnome", "Half-Elf", "Half-Orc", "Tiefling", "Dragonborn", "Aasimar", "Goliath"];
const ALIGNMENTS = [
    "Lawful Good", "Neutral Good", "Chaotic Good",
    "Lawful Neutral", "True Neutral", "Chaotic Neutral",
    "Lawful Evil", "Neutral Evil", "Chaotic Evil",
    "Unaligned"
];
const BACKGROUNDS = [
    "Acolyte", "Charlatan", "Criminal", "Entertainer", "Folk Hero",
    "Guild Artisan", "Hermit", "Noble", "Outlander", "Sage",
    "Sailor", "Soldier", "Urchin", "Custom"
];

/**
 * Pestaña GENERAL — identidad básica del personaje.
 * Recibe el personaje y un callback onUpdate(field, value) que el padre maneja.
 */
export default function GeneralSection({ character, onUpdate }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({
        name: character.name || "",
        charClass: character.charClass || "Fighter",
        race: character.race || "Human",
        level: character.level || 1,
        alignment: character.alignment || "True Neutral",
        background: character.background || "Custom",
        experiencePoints: character.experiencePoints || 0
    });

    const handleSave = (e) => {
        e.preventDefault();
        const payload = {
            ...draft,
            level: Number(draft.level),
            experiencePoints: Number(draft.experiencePoints)
        };
        onUpdate(payload);
        setEditing(false);
    };

    const handleCancel = () => {
        setDraft({
            name: character.name || "",
            charClass: character.charClass || "Fighter",
            race: character.race || "Human",
            level: character.level || 1,
            alignment: character.alignment || "True Neutral",
            background: character.background || "Custom",
            experiencePoints: character.experiencePoints || 0
        });
        setEditing(false);
    };

    if (editing) {
        return (
            <div className="scroll-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 style={{ margin: 0 }}>Editar identidad</h2>
                </div>
                <form onSubmit={handleSave}>
                    <div className="grid grid-2">
                        <div className="field">
                            <label>Nombre</label>
                            <input
                                value={draft.name}
                                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="field">
                            <label>Clase</label>
                            <select value={draft.charClass} onChange={(e) => setDraft({ ...draft, charClass: e.target.value })}>
                                {DND_CLASSES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="field">
                            <label>Raza</label>
                            <select value={draft.race} onChange={(e) => setDraft({ ...draft, race: e.target.value })}>
                                {DND_RACES.map(r => <option key={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="field">
                            <label>Nivel</label>
                            <input
                                type="number" min="1" max="20"
                                value={draft.level}
                                onChange={(e) => setDraft({ ...draft, level: e.target.value })}
                            />
                        </div>
                        <div className="field">
                            <label>Alineamiento</label>
                            <select value={draft.alignment} onChange={(e) => setDraft({ ...draft, alignment: e.target.value })}>
                                {ALIGNMENTS.map(a => <option key={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="field">
                            <label>Trasfondo</label>
                            <select value={draft.background} onChange={(e) => setDraft({ ...draft, background: e.target.value })}>
                                {BACKGROUNDS.map(b => <option key={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="field">
                            <label>Puntos de Experiencia</label>
                            <input
                                type="number" min="0"
                                value={draft.experiencePoints}
                                onChange={(e) => setDraft({ ...draft, experiencePoints: e.target.value })}
                            />
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button type="submit" className="btn btn-primary">Guardar</button>
                        <button type="button" className="btn" onClick={handleCancel}>Cancelar</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="scroll-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ margin: 0 }}>Identidad</h2>
                <button className="btn btn-small" onClick={() => setEditing(true)}>Editar</button>
            </div>

            <div className="grid grid-2">
                <InfoRow label="Nombre" value={character.name} />
                <InfoRow label="Clase" value={`${character.charClass} ${character.level}`} />
                <InfoRow label="Raza" value={character.race} />
                <InfoRow label="Alineamiento" value={character.alignment || "Sin definir"} />
                <InfoRow label="Trasfondo" value={character.background || "Sin definir"} />
                <InfoRow label="Experiencia" value={`${character.experiencePoints || 0} XP`} />
            </div>

            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(184, 134, 11, 0.08)", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <strong style={{ fontFamily: "Cinzel", fontSize: "0.9rem" }}>✨ INSPIRACIÓN</strong>
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--ink-faded)" }}>
                        Otorgada por el DM por buen roleplay. Permite repetir una tirada.
                    </p>
                </div>
                <button
                    className={`btn ${character.inspiration ? "btn-gold" : ""}`}
                    onClick={() => onUpdate({ inspiration: !character.inspiration })}
                >
                    {character.inspiration ? "✓ Activa" : "Activar"}
                </button>
            </div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div style={{ marginBottom: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--ink-faded)", textTransform: "uppercase", fontFamily: "Cinzel", letterSpacing: "0.5px" }}>{label}</div>
            <div style={{ fontSize: "1.05rem", fontWeight: "500" }}>{value}</div>
        </div>
    );
}
