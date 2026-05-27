export default function WelcomeGuide({ user, onClose }) {
    const pages = buildPages(user);

    return (
        <div
            className="modal-overlay modal-overlay--form"
            onClick={onClose}
            style={{ zIndex: 1000 }}
        >
            <div
                className="modal-content modal-content--form"
                style={{ maxWidth: "520px", padding: 0, overflow: "hidden" }}
                onClick={e => e.stopPropagation()}
            >
                {/* Cabecera */}
                <div style={{ padding: "1.5rem 1.75rem 1rem", borderBottom: "1px solid var(--parchment-shadow)" }}>
                    <h2 style={{ margin: 0, fontFamily: "Cinzel, serif", fontSize: "1.25rem" }}>
                        Bienvenido/a a StrongerThings
                    </h2>
                    <p style={{ margin: "0.4rem 0 0", fontSize: "0.88rem", color: "var(--ink-faded)" }}>
                        Un repaso rápido de todo lo que puedes hacer:
                    </p>
                </div>

                {/* Lista de páginas */}
                <div style={{ padding: "1rem 1.75rem", display: "flex", flexDirection: "column", gap: "0.85rem", maxHeight: "60vh", overflowY: "auto" }}>
                    {pages.map(({ icon, name, desc }) => (
                        <div key={name} style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "1.5rem", lineHeight: 1, flexShrink: 0, marginTop: "0.1rem" }}>{icon}</span>
                            <div>
                                <strong style={{ fontSize: "0.95rem", display: "block", marginBottom: "0.15rem" }}>{name}</strong>
                                <span style={{ fontSize: "0.83rem", color: "var(--ink-faded)" }}>{desc}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pie */}
                <div style={{ padding: "1rem 1.75rem 1.5rem", borderTop: "1px solid var(--parchment-shadow)", display: "flex", justifyContent: "flex-end" }}>
                    <button className="btn btn-primary" onClick={onClose}>
                        ¡Comenzar la aventura!
                    </button>
                </div>
            </div>
        </div>
    );
}

function buildPages(user) {
    const pages = [];

    if (user?.isDM) {
        pages.push({
            icon: "🗺️",
            name: "Campañas",
            desc: "Crea y gestiona tus campañas. Añade sesiones, lleva un log de lo que ocurre en cada una y gestiona los aventureros que participan.",
        });
    } else {
        pages.push({
            icon: "⚔️",
            name: "Personajes",
            desc: "Crea y gestiona tus personajes de D&D 5e. Rellena la hoja de personaje con atributos, habilidades, equipo y hechizos.",
        });
    }

    pages.push(
        {
            icon: "📖",
            name: "Crónicas",
            desc: user?.isDM
                ? "Un diario cronológico de todas tus sesiones. Repasa el historial de cada campaña y escribe notas privadas del DM."
                : "Consulta el historial de sesiones de las campañas en las que participas tus personajes.",
        },
        {
            icon: "📦",
            name: "Catálogo",
            desc: "Explora el inventario de objetos del SRD: armas, armaduras, pociones y objetos maravillosos.",
        },
        {
            icon: "✨",
            name: "Hechizos",
            desc: "Consulta todos los hechizos disponibles, organizados por escuela de magia y nivel.",
        }
    );

    if (user?.isDM) {
        pages.push({
            icon: "🐉",
            name: "Bestiario",
            desc: "Gestiona tu colección de monstruos. Usa las criaturas del SRD o crea las tuyas propias para sorprender a tus jugadores.",
        });
    }

    if (user?.role === "admin") {
        pages.push({
            icon: "🛡️",
            name: "Admin",
            desc: "Panel de administración: gestiona usuarios, roles y el contenido del SRD.",
        });
    }

    return pages;
}
