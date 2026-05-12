import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
    CLASS_OPTIONS,
    RACE_OPTIONS,
    ALIGNMENT_OPTIONS,
    translateClass,
    translateRace,
    translateAlignment
} from "../../utils/dndLabels.js";

const BACKGROUNDS = [
    "Acolyte", "Charlatan", "Criminal", "Entertainer", "Folk Hero",
    "Guild Artisan", "Hermit", "Noble", "Outlander", "Sage",
    "Sailor", "Soldier", "Urchin", "Custom"
];

const BACKGROUND_LABELS = {
    Acolyte:        "Acólito",
    Charlatan:      "Charlatán",
    Criminal:       "Criminal",
    Entertainer:    "Artista",
    "Folk Hero":    "Héroe del pueblo",
    "Guild Artisan":"Artesano gremial",
    Hermit:         "Ermitaño",
    Noble:          "Noble",
    Outlander:      "Forastero",
    Sage:           "Sabio",
    Sailor:         "Marinero",
    Soldier:        "Soldado",
    Urchin:         "Pilluelo",
    Custom:         "Personalizado"
};
const translateBackground = (en) => BACKGROUND_LABELS[en] || en;

/**
 * Pestaña GENERAL — identidad básica del personaje.
 * Recibe el personaje y un callback onUpdate(field, value) que el padre maneja.
 *
 * Si la URL trae ?edit=1, arranca directamente en modo edición.
 * Esto permite que el botón "Editar" de la lista de personajes (que enlaza
 * a /characters/:id?edit=1) abra el form ya desplegado.
 */
export default function GeneralSection({ character, onUpdate }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const editFromUrl = searchParams.get("edit") === "1";

    const [editing, setEditing] = useState(editFromUrl);
    const [draft, setDraft] = useState({
        name: character.name || "",
        charClass: character.charClass || "Fighter",
        race: character.race || "Human",
        level: character.level || 1,
        alignment: character.alignment || "True Neutral",
        background: character.background || "Custom",
        experiencePoints: character.experiencePoints || 0
    });

    // Si el query param ?edit=1 aparece después de montar (p.ej. el usuario
    // navega desde la lista mientras ya está en /characters/:id), activamos
    // el modo edición también.
    useEffect(() => {
        if (editFromUrl) setEditing(true);
    }, [editFromUrl]);

    // Limpia el query param ?edit sin recargar ni añadir entrada al historial.
    const clearEditParam = () => {
        if (searchParams.has("edit")) {
            const next = new URLSearchParams(searchParams);
            next.delete("edit");
            setSearchParams(next, { replace: true });
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        const payload = {
            ...draft,
            level: Number(draft.level),
            experiencePoints: Number(draft.experiencePoints)
        };
        onUpdate(payload);
        setEditing(false);
        clearEditParam();
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
        clearEditParam();
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
                                {CLASS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="field">
                            <label>Raza</label>
                            <select value={draft.race} onChange={(e) => setDraft({ ...draft, race: e.target.value })}>
                                {RACE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
                                {ALIGNMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="field">
                            <label>Trasfondo</label>
                            <select value={draft.background} onChange={(e) => setDraft({ ...draft, background: e.target.value })}>
                                {BACKGROUNDS.map(b => <option key={b} value={b}>{translateBackground(b)}</option>)}
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
                <InfoRow label="Clase" value={`${translateClass(character.charClass)} ${character.level}`} />
                <InfoRow label="Raza" value={translateRace(character.race)} />
                <InfoRow label="Alineamiento" value={translateAlignment(character.alignment) || "Sin definir"} />
                <InfoRow label="Trasfondo" value={translateBackground(character.background) || "Sin definir"} />
                <InfoRow label="Experiencia" value={`${character.experiencePoints || 0} PX`} />
            </div>

            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(184, 134, 11, 0.08)", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <strong style={{ fontFamily: "Cinzel", fontSize: "0.9rem" }}>✨ INSPIRACIÓN</strong>
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--ink-faded)" }}>
                        Otorgada por el Director de Juego por buen roleplay. Permite repetir una tirada.
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