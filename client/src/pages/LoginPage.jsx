import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleLoginButton from "../components/ui/GoogleLoginButton.jsx";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            navigate("/characters");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container auth-page">
            <div className="scroll-card">
                <h1 style={{ textAlign: "center", fontFamily: "MedievalSharp" }}>Entrar</h1>
                {error && <div className="alert">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="field">
                        <label>Contraseña</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
                        {loading ? "Entrando..." : "Entrar"}
                    </button>
                </form>
                <div style={{
            display: "flex",
            alignItems: "center",
            margin: "1.5rem 0",
            color: "var(--ink-faded)",
            fontSize: "0.85rem"
        }}>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--parchment-shadow)" }} />
            <span style={{ margin: "0 0.8rem", fontFamily: "'Cinzel', serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                o bien
            </span>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--parchment-shadow)" }} />
        </div>
        <GoogleLoginButton onError={(msg) => setError(msg)} />
                <p style={{ textAlign: "center", marginTop: "1rem" }}>
                    ¿No tienes cuenta? <Link to="/register">Crear una</Link>
                </p>
            </div>
        </div>
    );
}
