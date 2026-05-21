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
    const [showPassword, setShowPassword] = useState(false);

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
                        <div className="input-password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="input-password-toggle"
                                onClick={() => setShowPassword(v => !v)}
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                )}
                            </button>
                        </div>
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
