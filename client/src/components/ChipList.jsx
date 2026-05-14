import { useState, useRef, useEffect } from "react";

/**
 * Lista editable de "chips" / tags.
 * Permite añadir items con autocompletado opcional y eliminarlos.
 *
 * Props:
 * - values: string[]     → lista actual
 * - onChange: (next)=>void → callback con la nueva lista
 * - suggestions: string[] → opcionales para autocompletar
 * - placeholder: string  → texto del input
 * - emptyMessage: string → texto cuando no hay items
 */
export default function ChipList({
    values = [],
    onChange,
    suggestions = [],
    placeholder = "Añadir...",
    emptyMessage = "Sin elementos"
}) {
    const [draft, setDraft] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Cerrar sugerencias al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const addValue = (val) => {
        const trimmed = val.trim();
        if (!trimmed) return;
        // No añadir duplicados
        const exists = values.some(v => v.toLowerCase() === trimmed.toLowerCase());
        if (exists) {
            setDraft("");
            return;
        }
        onChange([...values, trimmed]);
        setDraft("");
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const removeValue = (idx) => {
        onChange(values.filter((_, i) => i !== idx));
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addValue(draft);
        } else if (e.key === "Backspace" && !draft && values.length > 0) {
            // Backspace sobre input vacío → elimina el último chip
            removeValue(values.length - 1);
        } else if (e.key === "Escape") {
            setDraft("");
            setShowSuggestions(false);
        }
    };

    // Filtrar sugerencias según lo que escribe el usuario
    const filteredSuggestions = suggestions
        .filter(s => {
            const q = draft.toLowerCase();
            if (!q) return true;
            return s.toLowerCase().includes(q);
        })
        .filter(s => !values.some(v => v.toLowerCase() === s.toLowerCase()))
        .slice(0, 8); // máximo 8 sugerencias

    return (
        <div className="chip-list" ref={containerRef}>
            <div className="chip-list__chips">
                {values.length === 0 && (
                    <span className="chip-list__empty">{emptyMessage}</span>
                )}
                {values.map((v, idx) => (
                    <span key={`${v}-${idx}`} className="chip">
                        {v}
                        <button
                            type="button"
                            className="chip__remove"
                            onClick={() => removeValue(idx)}
                            aria-label={`Eliminar ${v}`}
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>

            <div className="chip-list__input-wrap">
                <input
                    ref={inputRef}
                    type="text"
                    className="chip-list__input"
                    value={draft}
                    onChange={(e) => {
                        setDraft(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                />
                {draft && (
                    <button
                        type="button"
                        className="btn btn-small btn-primary"
                        onClick={() => addValue(draft)}
                        style={{ marginLeft: "0.3rem" }}
                    >
                        + Añadir
                    </button>
                )}

                {showSuggestions && filteredSuggestions.length > 0 && (
                    <ul className="chip-list__suggestions">
                        {filteredSuggestions.map(s => (
                            <li
                                key={s}
                                className="chip-list__suggestion"
                                onMouseDown={(e) => {
                                    e.preventDefault(); // evitar blur antes del click
                                    addValue(s);
                                }}
                            >
                                {s}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
