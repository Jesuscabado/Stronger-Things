import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AccountPage() {
    const { user, deleteAccount } = useAuth();
    const navigate = useNavigate();
    const [confirming, setConfirming] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleDelete = async () => {
        if (confirmText !== "BORRAR") return;
        setLoading(true);
        setError("");
        try {
            await deleteAccount();
            navigate("/login");
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="scroll-card" style={{ maxWidth: 640, margin: "0 auto 1.5rem" }}>
                <h1>Mi cuenta</h1>

                <div className="field">
                    <label>Nombre de aventurero</label>
                    <p style={{ margin: "0.25rem 0 0", fontWeight: 600 }}>{user?.username}</p>
                </div>
                <div className="field">
                    <label>Email</label>
                    <p style={{ margin: "0.25rem 0 0" }}>{user?.email}</p>
                </div>
                <div className="field">
                    <label>Método de acceso</label>
                    <p style={{ margin: "0.25rem 0 0", textTransform: "capitalize" }}>
                        {user?.provider === "both" ? "Email + Google" : user?.provider ?? "local"}
                    </p>
                </div>
            </div>

            <div className="scroll-card" style={{ maxWidth: 640, margin: "0 auto 1.5rem", borderColor: "var(--blood)" }}>
                <h2 style={{ color: "var(--blood)" }}>Zona de peligro</h2>

                <p style={{ marginBottom: "1rem" }}>
                    Eliminar tu cuenta borrará permanentemente todos tus personajes, diario, monstruos
                    personalizados y archivos subidos. <strong>Esta acción no se puede deshacer.</strong>
                </p>

                {!confirming && (
                    <button className="btn" style={{ borderColor: "var(--blood)", color: "var(--blood)" }}
                        onClick={() => setConfirming(true)}>
                        Eliminar mi cuenta
                    </button>
                )}

                {confirming && (
                    <div>
                        <p style={{ marginBottom: "0.75rem", fontWeight: 600 }}>
                            Escribe <code>BORRAR</code> para confirmar:
                        </p>
                        <div className="field">
                            <input
                                value={confirmText}
                                onChange={e => setConfirmText(e.target.value)}
                                placeholder="BORRAR"
                                autoFocus
                            />
                        </div>
                        {error && <div className="alert" style={{ marginBottom: "0.75rem" }}>{error}</div>}
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                            <button
                                className="btn btn-primary"
                                style={{ background: "var(--blood)", borderColor: "var(--blood)" }}
                                disabled={confirmText !== "BORRAR" || loading}
                                onClick={handleDelete}
                            >
                                {loading ? "Borrando..." : "Confirmar borrado"}
                            </button>
                            <button className="btn" onClick={() => { setConfirming(false); setConfirmText(""); }}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--ink-faded)" }}>
                <Link to="/privacy">Política de privacidad</Link>
                {" · "}
                <Link to="/terms">Términos de uso</Link>
            </div>
        </div>
    );
}
