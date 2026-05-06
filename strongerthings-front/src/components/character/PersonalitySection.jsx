import { useState, useEffect, useRef } from "react";

/**
 * Pestaña PERSONALIDAD — narrativa del personaje.
 * Edición inline: click → textarea → Esc cancela, Ctrl+Enter o blur guarda.
 */
export default function PersonalitySection({ character, onUpdate }) {
    const personality = character.personality || {};

    const updatePersonality = (field, value) => {
        onUpdate({
            personality: { ...personality, [field]: value }
        });
    };

    return (
        <>
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

            <div className="scroll-card">
                <h2>👁 Aspecto físico</h2>
                <NarrativeField
                    label=""
                    placeholder="Describe a tu personaje: cicatrices, vestimenta habitual, manera de moverse, expresiones, lo que destaca al verlo por primera vez..."
                    value={personality.appearance}
                    onSave={(v) => updatePersonality("appearance", v)}
                    rows={5}
                />
            </div>

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
 * Campo de texto con edición inline.
 * - Click en el display → entra en modo edición.
 * - Escape → cancela y restaura el valor original.
 * - Ctrl/Cmd+Enter o pérdida de foco → guarda.
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
