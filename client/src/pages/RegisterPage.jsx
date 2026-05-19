import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleLoginButton from "../components/ui/GoogleLoginButton.jsx";

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register(form.username, form.email, form.password);
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
                <h1 style={{ textAlign: "center", fontFamily: "MedievalSharp" }}>Forjar cuenta</h1>
                {error && <div className="alert">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Nombre de aventurero</label>
                        <input name="username" value={form.username} onChange={handleChange} required minLength={3} />
                    </div>
                    <div className="field">
                        <label>Email</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="field">
                        <label>Contraseña</label>
                        <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
                        {loading ? "Forjando..." : "Crear cuenta"}
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
                    ¿Ya tienes cuenta? <Link to="/login">Entrar</Link>
                </p>
            </div>
        </div>
    );
}
