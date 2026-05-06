import { useState, useEffect, useRef } from "react";

/**
 * Pestaña PERSONALIDAD — narrativa del personaje + características físicas.
 */
export default function PersonalitySection({ character, onUpdate }) {
    const personality = character.personality || {};
    const physical = character.physical || {};

    const updatePersonality = (field, value) => {
        onUpdate({
            personality: { ...personality, [field]: value }
        });
    };

    const updatePhysical = (field, value) => {
        onUpdate({
            physical: { ...physical, [field]: value }
        });
    };

    return (
        <>
            {/* Bloque 0: Características físicas (NUEVO en Fase 4) */}
            <div className="scroll-card">
                <h2>👤 Características físicas</h2>
                <div className="physical-grid">
                    <PhysicalField
                        label="Edad"
                        icon="⏳"
                        placeholder="27"
                        value={physical.age}
                        onSave={(v) => updatePhysical("age", v)}
                    />
                    <PhysicalField
                        label="Altura"
                        icon="📏"
                        placeholder="180 cm"
                        value={physical.height}
                        onSave={(v) => updatePhysical("height", v)}
                    />
                    <PhysicalField
                        label="Peso"
                        icon="⚖"
                        placeholder="75 kg"
                        value={physical.weight}
                        onSave={(v) => updatePhysical("weight", v)}
                    />
                    <PhysicalField
                        label="Ojos"
                        icon="👁"
                        placeholder="verdes"
                        value={physical.eyes}
                        onSave={(v) => updatePhysical("eyes", v)}
                    />
                    <PhysicalField
                        label="Piel"
                        icon="🎨"
                        placeholder="morena"
                        value={physical.skin}
                        onSave={(v) => updatePhysical("skin", v)}
                    />
                    <PhysicalField
                        label="Pelo"
                        icon="💇"
                        placeholder="negro y rizado"
                        value={physical.hair}
                        onSave={(v) => updatePhysical("hair", v)}
                    />
                </div>
            </div>

            {/* Bloque 1: Personalidad core */}
            <div className="scroll-card">
                <h2>📖 Personalidad</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-faded)", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                    Click en cualquier campo para editarlo. Usa Esc para cancelar o Ctrl+Enter para guardar.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <NarrativeField
                        label="Rasgos de personalidad"
                        icon="✨"
                        placeholder="Ej: Soy reservado pero leal con quienes se ganan mi confianza."
                        value={personality.traits}
                        onSave={(v) => updatePersonality("traits", v)}
                        rows={3}
                    />
                    <NarrativeField
                        label="Ideales"
                        icon="⚖"
                        placeholder="Ej: Honor. Mi palabra es mi vínculo más sagrado."
                        value={personality.ideals}
                        onSave={(v) => updatePersonality("ideals", v)}
                        rows={3}
                    />
                    <NarrativeField
                        label="Vínculos"
                        icon="🤝"
                        placeholder="Ej: Daría mi vida por las personas con las que crecí."
                        value={personality.bonds}
                        onSave={(v) => updatePersonality("bonds", v)}
                        rows={3}
                    />
                    <NarrativeField
                        label="Defectos"
                        icon="⚠"
                        placeholder="Ej: Tengo problemas para confiar en magos."
                        value={personality.flaws}
                        onSave={(v) => updatePersonality("flaws", v)}
                        rows={3}
                    />
                </div>
            </div>

            {/* Bloque 2: Aspecto físico (descripción larga) */}
            <div className="scroll-card">
                <h2>🖼 Aspecto físico (descripción)</h2>
                <NarrativeField
                    label=""
                    placeholder="Describe a tu personaje: cicatrices, vestimenta habitual, manera de moverse, expresiones, lo que destaca al verlo por primera vez..."
                    value={personality.appearance}
                    onSave={(v) => updatePersonality("appearance", v)}
                    rows={5}
                />
            </div>

            {/* Bloque 3: Historia */}
            <div className="scroll-card">
                <h2>📜 Historia del personaje</h2>
                <NarrativeField
                    label=""
                    placeholder="¿De dónde viene? ¿Cómo llegó hasta aquí? ¿Qué eventos clave marcaron su vida? Esta es la historia personal de tu personaje antes de empezar la aventura."
                    value={personality.backstory}
                    onSave={(v) => updatePersonality("backstory", v)}
                    rows={8}
                />
            </div>

            {/* Bloque 4: Otros detalles */}
            <div className="scroll-card">
                <h2>🌟 Otros detalles</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
                    <NarrativeField
                        label="Aliados y organizaciones"
                        icon="⚜"
                        placeholder="Gremios, facciones, mentores, contactos importantes... Quiénes apoyan a tu personaje."
                        value={personality.allies}
                        onSave={(v) => updatePersonality("allies", v)}
                        rows={4}
                    />
                    <NarrativeField
                        label="Rasgos y atributos adicionales"
                        icon="🎭"
                        placeholder="Habilidades de raza, dotes, rasgos de clase importantes, idiomas, peculiaridades..."
                        value={personality.featuresAndTraits}
                        onSave={(v) => updatePersonality("featuresAndTraits", v)}
                        rows={4}
                    />
                    <NarrativeField
                        label="Tesoro"
                        icon="💎"
                        placeholder="Objetos especiales, gemas, joyas, reliquias o cualquier tesoro fuera del oro común."
                        value={personality.treasure}
                        onSave={(v) => updatePersonality("treasure", v)}
                        rows={4}
                    />
                </div>
            </div>
        </>
    );
}

/**
 * Campo físico compacto: input pequeño con label encima.
 */
function PhysicalField({ label, icon, placeholder, value, onSave }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value || "");
    const inputRef = useRef(null);

    useEffect(() => {
        setDraft(value || "");
    }, [value]);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    const commit = () => {
        if (draft !== (value || "")) {
            onSave(draft);
        }
        setEditing(false);
    };

    const cancel = () => {
        setDraft(value || "");
        setEditing(false);
    };

    return (
        <div className="physical-field">
            <div className="physical-field__label">
                {icon && <span style={{ marginRight: "0.3rem" }}>{icon}</span>}
                {label}
            </div>
            {editing ? (
                <input
                    ref={inputRef}
                    type="text"
                    className="physical-field__input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); commit(); }
                        if (e.key === "Escape") { e.preventDefault(); cancel(); }
                    }}
                    placeholder={placeholder}
                />
            ) : (
                <div
                    className="physical-field__display"
                    onClick={() => setEditing(true)}
                >
                    {value ? (
                        <span className="physical-field__value">{value}</span>
                    ) : (
                        <span className="physical-field__placeholder">{placeholder}</span>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Campo narrativo grande con edición inline (textarea).
 */
function NarrativeField({ label, icon, placeholder, value, onSave, rows = 3 }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value || "");
    const textareaRef = useRef(null);

    useEffect(() => {
        setDraft(value || "");
    }, [value]);

    useEffect(() => {
        if (editing && textareaRef.current) {
            textareaRef.current.focus();
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
        }
    }, [editing]);

    const commit = () => {
        if (draft !== (value || "")) {
            onSave(draft);
        }
        setEditing(false);
    };

    const cancel = () => {
        setDraft(value || "");
        setEditing(false);
    };

    const handleKey = (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            cancel();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            commit();
        }
    };

    return (
        <div className="narrative-field">
            {label && (
                <div className="narrative-field__label">
                    {icon && <span style={{ marginRight: "0.4rem" }}>{icon}</span>}
                    {label}
                </div>
            )}
            {editing ? (
                <textarea
                    ref={textareaRef}
                    className="narrative-field__textarea"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={handleKey}
                    rows={rows}
                    placeholder={placeholder}
                />
            ) : (
                <div
                    className="narrative-field__display"
                    onClick={() => setEditing(true)}
                    style={{ minHeight: `${rows * 1.5}em` }}
                >
                    {value ? (
                        <span className="narrative-field__text">{value}</span>
                    ) : (
                        <span className="narrative-field__placeholder">{placeholder}</span>
                    )}
                </div>
            )}
        </div>
    );
}
