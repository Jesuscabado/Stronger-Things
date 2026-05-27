import { useState } from "react";

export default function PageIntro({ pageKey, text }) {
    const storageKey = `st_intro_${pageKey}`;
    const [visible, setVisible] = useState(() => !localStorage.getItem(storageKey));

    if (!visible) return null;

    const dismiss = () => {
        localStorage.setItem(storageKey, "1");
        setVisible(false);
    };

    return (
        <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
            padding: "0.85rem 1.1rem",
            marginBottom: "1.25rem",
            borderRadius: "6px",
            border: "1px solid var(--gold)",
            background: "rgba(184,134,11,0.07)",
            fontSize: "0.88rem",
            color: "var(--ink)",
            lineHeight: 1.5,
        }}>
            <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: "0.05rem" }}>📜</span>
            <span style={{ flex: 1 }}>{text}</span>
            <button
                onClick={dismiss}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faded)", fontSize: "1rem", lineHeight: 1, flexShrink: 0, padding: "0 0.1rem" }}
                aria-label="Cerrar"
            >
                ×
            </button>
        </div>
    );
}
