/**
 * Modal de previsualización de PDF embebido vía iframe.
 * Ocupa el 95% de la ventana para mostrar el PDF a tamaño hoja completo.
 */
export default function PDFPreviewModal({ url, filename, onClose }) {
    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem"
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "95vw",
                    height: "95vh",
                    background: "var(--parchment, #f5e9d4)",
                    border: "2px solid var(--gold, #b8860b)",
                    borderRadius: "4px",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    flexDirection: "column",
                    padding: "1rem",
                    boxSizing: "border-box"
                }}
            >
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.8rem",
                    flexShrink: 0
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: "1.3rem",
                        fontFamily: "Cinzel, serif"
                    }}>
                        📜 {filename || "Hoja de personaje"}
                    </h2>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <a
                            className="btn btn-small btn-gold"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir en pestaña nueva"
                        >
                            🔗 Pestaña nueva
                        </a>
                        <button
                            className="btn btn-small"
                            onClick={onClose}
                            aria-label="Cerrar"
                            style={{ fontSize: "1.2rem", padding: "0.2rem 0.7rem" }}
                        >
                            ×
                        </button>
                    </div>
                </div>

                <iframe
                    src={`${url}#view=FitH`}
                    title={filename || "PDF"}
                    style={{
                        width: "100%",
                        flex: 1,
                        border: "1px solid var(--parchment-shadow, #c4a878)",
                        borderRadius: "2px",
                        background: "#fff",
                        minHeight: 0
                    }}
                />
            </div>
        </div>
    );
}