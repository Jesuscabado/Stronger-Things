import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate("/login");
    };

    // Cierra el menú al cambiar de ruta (cuando el usuario pulsa un Link).
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    // Cierra el menú con Escape (accesibilidad básica).
    useEffect(() => {
        if (!menuOpen) return;
        const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [menuOpen]);

    return (
        <header className="app-header">
            <div className="app-header__inner">
                <div className="app-header__brand">
                    <Link to={user ? (user.isDM ? "/campaigns" : "/characters") : "/login"}>
                        <img src="/icon.svg" alt="" className="app-header__logo" aria-hidden="true" />
                        StrongerThings
                    </Link>
                </div>

                {/* Botón hamburguesa: solo visible en móvil (lo controla el CSS) */}
                <button
                    type="button"
                    className={`app-header__burger ${menuOpen ? "app-header__burger--open" : ""}`}
                    aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                    aria-expanded={menuOpen}
                    aria-controls="primary-navigation"
                    onClick={() => setMenuOpen(o => !o)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                {/*
                    En desktop el nav siempre se ve (CSS lo fuerza).
                    En móvil sólo se ve cuando menuOpen === true (clase --open).
                */}
                <nav
                    id="primary-navigation"
                    className={`app-header__nav ${menuOpen ? "app-header__nav--open" : ""}`}
                >
                    {user ? (
                        <>
                            {user.isDM
                                ? <Link to="/campaigns">Campañas</Link>
                                : <Link to="/characters">Personajes</Link>
                            }
                            <Link to="/objects">Catálogo</Link>
                            <Link to="/spells">Hechizos</Link>
                            <Link to="/diary">Crónicas</Link>
                            {user.isDM && <Link to="/bestiary">Bestiario</Link>}
                            {(user.role === "admin" || user.features?.includes("maps")) && <Link to="/maps">Mapas</Link>}
                            {user.role === "admin" && <Link to="/admin">Admin</Link>}
                            <Link to="/account" style={{ opacity: 0.7 }}>{user.username}</Link>
                            <button className="btn btn-small" onClick={handleLogout}>Salir</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Entrar</Link>
                            <Link to="/register">Registrarse</Link>
                        </>
                    )}
                    <ThemeToggle />
                </nav>
            </div>
        </header>
    );
}